import { render, screen } from "@testing-library/react";
import Chatroom from "./Chatroom";

test("render chatroom username not enterd", () => {
  render(<Chatroom />);
  const linkElement = screen.getByText(/what should we call you/i);
  expect(linkElement).toBeInTheDocument();
});
