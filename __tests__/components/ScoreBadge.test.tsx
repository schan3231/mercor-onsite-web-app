import { render, screen } from "@testing-library/react";
import ScoreBadge from "@/components/ScoreBadge";

describe("ScoreBadge", () => {
  it("renders the score number", () => {
    render(<ScoreBadge score={82} />);
    expect(screen.getByText("82")).toBeInTheDocument();
  });

  it("renders 0 score", () => {
    render(<ScoreBadge score={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("applies emerald background for score >= 75", () => {
    const { container } = render(<ScoreBadge score={75} />);
    expect(container.firstChild).toHaveClass("bg-emerald-500");
  });

  it("applies emerald background for score 100", () => {
    const { container } = render(<ScoreBadge score={100} />);
    expect(container.firstChild).toHaveClass("bg-emerald-500");
  });

  it("applies amber background for score 55-74", () => {
    const { container } = render(<ScoreBadge score={65} />);
    expect(container.firstChild).toHaveClass("bg-amber-400");
  });

  it("applies amber background for score at boundary 55", () => {
    const { container } = render(<ScoreBadge score={55} />);
    expect(container.firstChild).toHaveClass("bg-amber-400");
  });

  it("applies rose background for score below 55", () => {
    const { container } = render(<ScoreBadge score={40} />);
    expect(container.firstChild).toHaveClass("bg-rose-400");
  });

  it("applies sm size classes", () => {
    const { container } = render(<ScoreBadge score={70} size="sm" />);
    expect(container.firstChild).toHaveClass("w-8", "h-8");
  });

  it("applies lg size classes", () => {
    const { container } = render(<ScoreBadge score={70} size="lg" />);
    expect(container.firstChild).toHaveClass("w-14", "h-14");
  });

  it("has a title attribute with the score", () => {
    const { container } = render(<ScoreBadge score={88} />);
    expect(container.firstChild).toHaveAttribute("title", "Score: 88/100");
  });
});
