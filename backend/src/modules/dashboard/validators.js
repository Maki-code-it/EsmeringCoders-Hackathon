// Query validators and parsers, shaped for the shared validateRequest middleware (return { field: message }; empty object = valid).

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TYPE_PATTERN = /^[a-z_]{1,50}$/;

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

const isRealDate = (value) => {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

export const validateRangeQuery = (req) => {
  const errors = {};
  const { from, to } = req.query;
  if (from !== undefined && !isRealDate(String(from))) errors.from = 'from must be a date (YYYY-MM-DD)';
  if (to !== undefined && !isRealDate(String(to))) errors.to = 'to must be a date (YYYY-MM-DD)';
  if (!errors.from && !errors.to && from && to && String(from) > String(to)) {
    errors.from = 'from must not be after to';
  }
  return errors;
};

export const validateHistoryQuery = (req) => {
  const errors = {};
  const { limit, offset, type } = req.query;
  if (limit !== undefined && !(/^\d+$/.test(String(limit)) && +limit >= 1 && +limit <= MAX_LIMIT)) {
    errors.limit = `limit must be a whole number from 1 to ${MAX_LIMIT}`;
  }
  if (offset !== undefined && !/^\d+$/.test(String(offset))) {
    errors.offset = 'offset must be a whole number of 0 or more';
  }
  if (type !== undefined && !TYPE_PATTERN.test(String(type))) {
    errors.type = 'type may only contain lowercase letters and underscores';
  }
  return errors;
};

export const parseRange = (query) => ({
  from: query.from ? String(query.from) : undefined,
  to: query.to ? String(query.to) : undefined,
});

export const parseHistoryQuery = (query) => ({
  limit: query.limit ? Number(query.limit) : DEFAULT_LIMIT,
  offset: query.offset ? Number(query.offset) : 0,
  type: query.type ? String(query.type) : undefined,
});
