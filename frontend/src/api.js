export async function api(path, options = {}) {
  const { body, headers, ...requestOptions } = options;
  const token = window.localStorage.getItem("rodzicplus-token");

  const response = await fetch(path, {
    ...requestOptions,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Wystąpił błąd połączenia z serwerem.");
  }

  return data;
}
