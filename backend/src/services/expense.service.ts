import pool from '../database/pool';
import { CreateExpenseInput } from '../validators/expense.validator';
import { makeAccessErr, requireTripAccess } from './tripAccess.service';

type Participant = {
  user_id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor';
};

const getParticipants = async (tripId: string): Promise<Participant[]> => {
  const { rows } = await pool.query(
    `SELECT t.user_id, u.name, u.email, 'owner' AS role, t.created_at
     FROM trips t
     JOIN users u ON u.id = t.user_id
     WHERE t.id = $1
     UNION ALL
     SELECT tm.user_id, u.name, u.email, tm.role, tm.created_at
     FROM trip_members tm
     JOIN users u ON u.id = tm.user_id
     WHERE tm.trip_id = $1
     ORDER BY created_at ASC`,
    [tripId]
  );

  return rows;
};

const allocateEqualShares = (amount: number, count: number) => {
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / count);
  let remainder = cents - base * count;

  return Array.from({ length: count }, () => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return (base + extra) / 100;
  });
};

const getBudgetCurrency = async (tripId: string) => {
  const { rows } = await pool.query(
    `SELECT currency FROM trip_budgets WHERE trip_id = $1`,
    [tripId]
  );

  return rows[0]?.currency || 'USD';
};

const getExpenseRows = async (tripId: string) => {
  const { rows } = await pool.query(
    `SELECT e.*,
            payer.name AS paid_by_name,
            creator.name AS created_by_name,
            COALESCE(
              json_agg(
                json_build_object(
                  'user_id', s.user_id,
                  'name', su.name,
                  'email', su.email,
                  'share_amount', s.share_amount
                ) ORDER BY su.name
              ) FILTER (WHERE s.id IS NOT NULL),
              '[]'
            ) AS splits
     FROM trip_expenses e
     JOIN users payer ON payer.id = e.paid_by
     LEFT JOIN users creator ON creator.id = e.created_by
     LEFT JOIN trip_expense_splits s ON s.expense_id = e.id
     LEFT JOIN users su ON su.id = s.user_id
     WHERE e.trip_id = $1
     GROUP BY e.id, payer.name, creator.name
     ORDER BY e.expense_date DESC, e.created_at DESC`,
    [tripId]
  );

  return rows;
};

const getBalances = async (tripId: string, participants: Participant[]) => {
  const balances = new Map<string, number>();
  participants.forEach(p => balances.set(p.user_id, 0));

  const { rows } = await pool.query(
    `SELECT paid_by AS user_id, SUM(converted_amount)::numeric AS amount
     FROM trip_expenses
     WHERE trip_id = $1
     GROUP BY paid_by
     UNION ALL
     SELECT s.user_id, -SUM(s.share_amount)::numeric AS amount
     FROM trip_expense_splits s
     JOIN trip_expenses e ON e.id = s.expense_id
     WHERE e.trip_id = $1
     GROUP BY s.user_id`,
    [tripId]
  );

  rows.forEach(row => {
    balances.set(row.user_id, (balances.get(row.user_id) || 0) + Number(row.amount || 0));
  });

  return participants.map(p => ({
    ...p,
    balance: Number((balances.get(p.user_id) || 0).toFixed(2)),
  }));
};

export const getExpenseSummary = async (tripId: string, userId: string) => {
  await requireTripAccess(tripId, userId);

  const participants = await getParticipants(tripId);
  const expenses = await getExpenseRows(tripId);
  const balances = await getBalances(tripId, participants);
  const total = expenses.reduce((sum, expense) => sum + Number(expense.converted_amount || 0), 0);

  return {
    expenses,
    participants,
    balances,
    total: Number(total.toFixed(2)),
  };
};

export const createExpense = async (tripId: string, userId: string, input: CreateExpenseInput) => {
  await requireTripAccess(tripId, userId);

  const participants = await getParticipants(tripId);
  const participantIds = new Set(participants.map(p => p.user_id));
  const paidBy = input.paid_by || userId;
  const budgetCurrency = await getBudgetCurrency(tripId);
  const expenseCurrency = input.currency.toUpperCase();
  const exchangeRate = expenseCurrency === budgetCurrency
    ? 1
    : input.exchange_rate_to_budget;

  if (!exchangeRate) {
    throw makeAccessErr(`Enter an exchange rate from ${expenseCurrency} to ${budgetCurrency}`, 400);
  }

  const convertedAmount = Number((input.amount * exchangeRate).toFixed(2));

  if (!participantIds.has(paidBy)) {
    throw makeAccessErr('Paid by must be a tripmate', 400);
  }

  const splitUserIds = input.split_user_ids?.length ? input.split_user_ids : participants.map(p => p.user_id);
  const uniqueSplitUserIds = Array.from(new Set(splitUserIds));
  if (uniqueSplitUserIds.some(id => !participantIds.has(id))) {
    throw makeAccessErr('Split users must be tripmates', 400);
  }

  const shares = allocateEqualShares(convertedAmount, uniqueSplitUserIds.length);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO trip_expenses
        (trip_id, title, category, amount, currency, exchange_rate_to_budget, converted_amount, paid_by, created_by, expense_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        tripId,
        input.title,
        input.category,
        input.amount,
        expenseCurrency,
        exchangeRate,
        convertedAmount,
        paidBy,
        userId,
        input.expense_date ?? new Date().toISOString().slice(0, 10),
        input.notes ?? null,
      ]
    );

    const expense = rows[0];
    for (let i = 0; i < uniqueSplitUserIds.length; i += 1) {
      await client.query(
        `INSERT INTO trip_expense_splits (expense_id, user_id, share_amount)
         VALUES ($1, $2, $3)`,
        [expense.id, uniqueSplitUserIds[i], shares[i]]
      );
    }

    await client.query('COMMIT');
    return expense;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const deleteExpense = async (tripId: string, expenseId: string, userId: string) => {
  await requireTripAccess(tripId, userId);

  const { rowCount } = await pool.query(
    `DELETE FROM trip_expenses WHERE id = $1 AND trip_id = $2`,
    [expenseId, tripId]
  );
  if (!rowCount) throw makeAccessErr('Expense not found', 404);
};
