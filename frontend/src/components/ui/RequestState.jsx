export default function RequestState({ loading, error, onRetry }) {
  if (error)
    return (
      <div
        role="alert"
        className="p-4 bg-red-50 text-red-800 rounded-2xl border border-red-200 mb-4"
      >
        {error.message}{" "}
        {onRetry && (
          <button className="underline font-bold ml-2" onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    );
  if (loading)
    return (
      <p role="status" className="p-4 text-gray-500">
        Cargando…
      </p>
    );
  return null;
}
