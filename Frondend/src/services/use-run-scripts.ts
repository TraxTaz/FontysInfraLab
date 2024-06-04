import { useState } from "react";
import axios from "axios";

const useRunScripts = () => {
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const runScripts = async () => {
    setIsPending(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}teacher/run-scripts`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("Access_token")}`,
          },
        }
      );
      console.log(response.data);
    } catch (error) {
      console.error(error);
      setError(error as Error);
    } finally {
      setIsPending(false);
    }
  };

  return { error, isPending, runScripts };
};

export default useRunScripts;
