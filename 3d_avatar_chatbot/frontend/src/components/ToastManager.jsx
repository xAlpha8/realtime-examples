import React, { useContext, useEffect } from "react";
import { ChatContext } from "../context";
import { toast } from "react-hot-toast"

const ToastManager = () => {
  const { messages, setMessages } = useContext(ChatContext);
  useEffect(() => {
    if (messages.length > 0) {
        if (messages[0].toast) {
            toast(messages[0].toast)
        }
    } else {
      console.log("Empty");
    }
  }, [messages]);

}

export {
    ToastManager
}