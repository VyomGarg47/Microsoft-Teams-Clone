import { render, screen } from "@testing-library/react";
import App from "./App";

test("render Home page", () => {
  render(<App />);
  const linkElement = screen.getByText(/Microsoft Teams Clone/i);
  expect(linkElement).toBeInTheDocument();
});

test("render Home page", () => {
  render(<App />);
  const linkElement = screen.getByText(/Start or join a meeting/i);
  expect(linkElement).toBeInTheDocument();
});
