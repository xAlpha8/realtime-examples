import React, { useContext, useEffect } from "react";
import { ChatContext } from "../context";
import { toast } from "react-hot-toast"

const ToastManager = () => {
  const { messages, setMessages } = useContext(ChatContext);
  useEffect(() => {
    if (messages.length > 0) {
        if (messages[0].link) {
            if (messages[0].link == "https://cal.com/adaptsdk/30min") {
                toast.custom((t) => (
                    <div
                      className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                    >
                      <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <img
                              className="h-10 w-10 rounded-full"
                              src="https://i.ibb.co/K6xx41t/p7ykgzou3hjxhvepevcq-1.jpg"
                              alt=""
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Doctor House
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              Book an appointment with me!
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex border-l border-gray-200">
                        <button
                          onClick={() => toast.dismiss(t.id)}
                          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          Calendar
                        </button>
                      </div>
                   </div>
                  ))
             } else if(messages[0].link == "https://www.webmd.com/") {
                toast(<div>
                    Click <a href={messages[0].link} target="_blank" style={{ color: 'blue' }}>here</a> for home page.
                </div>, {
                    icon: '🏠',
                  });
             } else {
                toast(<div>
                    Click <a href={messages[0].link} target="_blank" style={{ color: 'blue' }}>here</a> for more information.
                </div>)
            }
        }
    } else {
      console.log("Empty");
    }
  }, [messages]);

}

export {
    ToastManager
}