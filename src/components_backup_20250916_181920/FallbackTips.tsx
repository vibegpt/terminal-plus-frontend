import React from "react";

type Props = {
  fallbacks: string[];
  showWhen?: boolean;
};

const FallbackTips: React.FC<Props> = ({ fallbacks, showWhen = true }) => {
  if (!fallbacks || fallbacks.length === 0 || !showWhen) return null;

  return (
    <div className="mt-4 bg-orange-50 border border-orange-200 p-4 rounded-xl shadow-sm animate-fadeIn">
      <h3 className="text-sm font-semibold text-orange-800 mb-2">
        Can't find what you're looking for?
      </h3>
      <ul className="list-disc pl-5 text-xs text-orange-700 space-y-1">
        {fallbacks.map((tip, idx) => (
          <li key={idx}>{tip}</li>
        ))}
      </ul>
    </div>
  );
};

export default FallbackTips; 