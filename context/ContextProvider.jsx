import { useState } from "react";
import { Context } from "./Context";
import main from "../../config/gemini";

const ContextProvider = (props) => {
  const [input, setInput] = useState("");
  const [recentPrompt, setRecentPrompt] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState("");
  const [prevPrompts, setPrevPrompts] = useState([]); // ✅ correct spelling + array

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const formatBold = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  };

  // queue for typing effect
  let typingQueue = [];

  const typeEffect = async () => {
    while (typingQueue.length > 0) {
      const word = typingQueue.shift();
      setResultData((prev) => prev + word + " ");
      await delay(50);
    }
    setLoading(false);
  };

  const onSent = async (customPrompt = null) => {
    const prompt = customPrompt || input;
    if (!prompt) return;

    setResultData("");
    setLoading(true);
    setShowResult(true);
    setRecentPrompt(prompt);

    // ✅ only add if it's new
    setPrevPrompts((prev) =>
      prev.includes(prompt) ? prev : [...prev, prompt]
    );

    typingQueue = [];

    try {
      const responseStream = await main(prompt);

      for await (const chunk of responseStream) {
        if (chunk.text) {
          const formattedChunk = formatBold(chunk.text);
          let newResponse2 = formattedChunk.replace(/\*/g, "<br/>");
          let newResponseArray = newResponse2.split(" ");

          typingQueue.push(...newResponseArray);

          if (typingQueue.length === newResponseArray.length) {
            typeEffect();
          }
        }
      }
    } catch (err) {
      console.error(err);
      setResultData("Error generating response.");
      setLoading(false);
    } finally {
      setInput("");
    }
  };

  const contextValue = {
    input,
    setInput,
    recentPrompt,
    showResult,
    loading,
    resultData,
    onSent,
    prevPrompts,       // ✅ now available
    setRecentPrompt,   // ✅ useful for Sidebar clicks
  };

  return (
    <Context.Provider value={contextValue}>
      {props.children}
    </Context.Provider>
  );
};

export default ContextProvider;
