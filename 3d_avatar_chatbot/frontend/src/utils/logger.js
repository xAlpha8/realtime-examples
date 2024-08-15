/**
 * Logs a labeled message to the console with a timestamp.
 *
 * @param {string} label - The label to prepend to the log message.
 * @param {...any} message - The message or data to log.
 */
export function logger(label, ...message) {
  console.log(
    label,
    new Date().toLocaleTimeString("en-US", {
      hour12: false, // Use 24-hour format
      hour: "2-digit", // Display hours with two digits
      minute: "2-digit", // Display minutes with two digits
      second: "2-digit", // Display seconds with two digits
      fractionalSecondDigits: 3, // Display milliseconds
    }),
    ...message // Spread the message array for better readability in the console
  );
}
