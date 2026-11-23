// Plain-language messages for failed requests.
export function friendlyError(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  const server = err?.response?.data?.error || err?.response?.data?.message;
  if (server) return String(server);
  if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
    return 'The server is slow to answer. It may be waking up, so try again in a few seconds.';
  }
  if (!err.response) return "Can't reach the server. Check your internet connection.";
  return fallback;
}

// Short version for the small status line under a header.
export function shortError(err) {
  if (!err) return '';
  if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) return 'Server is slow';
  if (!err.response) return 'Offline';
  return 'Could not update';
}
