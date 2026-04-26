import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Options from "./Options.jsx";

describe("Settings page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders assistive settings and help guide", () => {
    render(<Options />);

    expect(screen.getByRole("heading", { name: /inclusive web assistant settings/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred voice/i)).toBeInTheDocument();
    expect(screen.getByText(/read aloud/i)).toBeInTheDocument();
    expect(screen.getByText(/dyslexia mode/i)).toBeInTheDocument();
  });

  it("saves preferences", () => {
    render(<Options />);

    fireEvent.change(screen.getByLabelText(/preferred language/i), { target: { value: "hi" } });
    fireEvent.click(screen.getByRole("button", { name: /save preferences/i }));

    expect(JSON.parse(localStorage.getItem("inclusiveWebAssistantSettings"))).toEqual(
      expect.objectContaining({ preferredLanguage: "hi" })
    );
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });
});
