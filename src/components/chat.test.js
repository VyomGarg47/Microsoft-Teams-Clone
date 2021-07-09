import { render, screen } from "@testing-library/react";
import Chat from "./Chat";

test("render chat", () => {
  const messages = [];
  render(<Chat user={{ uid: "xyzabc" }} messages={messages} />);
  const linkElement = screen.getByText(/Meeting chat/i);
  expect(linkElement).toBeInTheDocument();
});
