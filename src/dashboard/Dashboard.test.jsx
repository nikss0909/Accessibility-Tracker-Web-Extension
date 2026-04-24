import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Dashboard from "./Dashboard.jsx";

describe("Dashboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders authentication before dashboard access", () => {
    render(<Dashboard />);

    expect(screen.getAllByRole("button", { name: "Login" })).toHaveLength(2);
    expect(screen.getByText(/developer accessibility operations/i)).toBeInTheDocument();
  });

  it("opens the operational dashboard after login", () => {
    render(<Dashboard />);

    fireEvent.click(screen.getAllByRole("button", { name: "Login" })[1]);

    expect(screen.getByRole("heading", { name: "Accessibility Operations" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Issue Collaboration" })).toBeInTheDocument();
  });
});
