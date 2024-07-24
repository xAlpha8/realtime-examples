export const fetch_start_agent = async (
  serverUrl: string,
  serverAuth: string | null
) => {
  const req = await fetch(`${serverUrl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serverAuth}`
    },
    body: JSON.stringify({}),
  });

  const data = await req.json();

  if (!req.ok) {
    if (req.status === 502 || req.status === 500) {
      return { error: true, detail: "We are currently at capacity for this demo. Please try again later.", status: 502 };
    }
    return { error: true, detail: data.result, status: req.status };
  }
  return data;
};
