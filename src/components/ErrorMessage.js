// A red notice box. Renders nothing when `message` is empty, so you can
// always write <ErrorMessage message={error} /> without an if-statement.
export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="error" role="alert">
      {message}
    </div>
  );
}
