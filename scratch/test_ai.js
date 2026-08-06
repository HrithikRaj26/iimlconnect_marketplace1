const test = async () => {
  const res = await fetch("http://localhost:3000/api/llm-router", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "lost a laptop" })
  });
  const text = await res.text();
  console.log(res.status, text);
};
test();
