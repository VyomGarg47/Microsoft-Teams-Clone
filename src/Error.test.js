import { render, screen } from "@testing-library/react";
import Error from "./Error";
import { BrowserRouter as Router } from "react-router-dom";
test("Error", () => {
  render(
    <Router>
      <Error />
    </Router>
  );
  const linkElement = screen.getByText(/Access Denied/i);
  expect(linkElement).toBeInTheDocument();
});
