// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Component Testing Infrastructure", () => {
  it("renders a simple element in jsdom environment", () => {
    render(<div data-testid="test-element">Kariyar Setu</div>);
    expect(screen.getByTestId("test-element").textContent).toBe("Kariyar Setu");
  });
});
