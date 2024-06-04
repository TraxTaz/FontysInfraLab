import { useState, useEffect } from "react";
import useRunScripts from "../services/use-run-scripts";

export default function RunScriptsButton() {
  const { error, isPending, runScripts } = useRunScripts();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 2000); // Show error for 2 seconds

      return () => clearTimeout(timer);
    }
  }, [error]);

  let buttonText = isPending ? "Running..." : "Run Scripts";
  if (showError) {
    buttonText = "Error";
  }

  return (
    <button
      onClick={runScripts}
      disabled={isPending}
      className="text-white bg-primary-purple hover:bg-primary-purple-dark px-3 py-2 rounded-md hover:cursor-pointer text-nowrap mt-4"
    >
      {buttonText}
    </button>
  );
}
