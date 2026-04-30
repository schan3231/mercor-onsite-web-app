import { render, screen, fireEvent } from "@testing-library/react";
import CandidateCard from "@/components/CandidateCard";
import { scoredMasters, scoredDesigner } from "@/__tests__/fixtures/mockCandidates";

const defaultProps = {
  candidate: scoredMasters,
  onSelect: jest.fn(),
  onAddToTeam: jest.fn(),
  isInTeam: false,
  isTeamFull: false,
  activeRoleLabel: "CTO",
  bonusSkills: ["React", "TypeScript"],
};

beforeEach(() => jest.clearAllMocks());

describe("CandidateCard — rendering", () => {
  it("renders the candidate name", () => {
    render(<CandidateCard {...defaultProps} />);
    expect(screen.getByText("Bob Masters")).toBeInTheDocument();
  });

  it("renders the candidate location", () => {
    render(<CandidateCard {...defaultProps} />);
    expect(screen.getByText("Canada")).toBeInTheDocument();
  });

  it("renders up to 4 skill chips", () => {
    render(<CandidateCard {...defaultProps} />);
    // scoredMasters has 8 skills; only first 4 should appear as chips
    expect(screen.getByText("Node JS")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("shows '+N more' when candidate has more than 4 skills", () => {
    render(<CandidateCard {...defaultProps} />);
    expect(screen.getByText(/\+\d+ more/)).toBeInTheDocument();
  });

  it("does not show '+N more' when candidate has 4 or fewer skills", () => {
    const fewSkills = {
      ...scoredMasters,
      skills: ["React", "TypeScript", "Node JS"],
    };
    render(<CandidateCard {...defaultProps} candidate={fewSkills} />);
    expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
  });

  it("shows Hired badge when isInTeam is true", () => {
    render(<CandidateCard {...defaultProps} isInTeam />);
    expect(screen.getByText("Hired")).toBeInTheDocument();
  });

  it("does not show Hired badge when isInTeam is false", () => {
    render(<CandidateCard {...defaultProps} isInTeam={false} />);
    expect(screen.queryByText("Hired")).not.toBeInTheDocument();
  });

  it("hire button shows 'Hire for [Role]' label", () => {
    render(<CandidateCard {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Hire for CTO/i })).toBeInTheDocument();
  });

  it("hire button shows 'Remove' when candidate is in team", () => {
    render(<CandidateCard {...defaultProps} isInTeam />);
    expect(screen.getByRole("button", { name: /Remove/i })).toBeInTheDocument();
  });

  it("hire button is disabled when team is full and candidate is not in team", () => {
    render(<CandidateCard {...defaultProps} isTeamFull isInTeam={false} />);
    const btn = screen.getByRole("button", { name: /Hire for CTO/i });
    expect(btn).toBeDisabled();
  });

  it("hire button is enabled when team is not full", () => {
    render(<CandidateCard {...defaultProps} isTeamFull={false} isInTeam={false} />);
    const btn = screen.getByRole("button", { name: /Hire for CTO/i });
    expect(btn).not.toBeDisabled();
  });
});

describe("CandidateCard — skill highlighting", () => {
  it("applies indigo classes to bonus skill chips", () => {
    render(<CandidateCard {...defaultProps} bonusSkills={["React"]} />);
    const reactChip = screen.getByText("React");
    expect(reactChip).toHaveClass("bg-indigo-100");
  });

  it("applies gray classes to non-bonus skill chips", () => {
    render(<CandidateCard {...defaultProps} bonusSkills={["React"]} />);
    const nodeChip = screen.getByText("Node JS");
    expect(nodeChip).toHaveClass("bg-gray-100");
  });
});

describe("CandidateCard — interactions", () => {
  it("clicking the card calls onSelect with the candidate", () => {
    const onSelect = jest.fn();
    render(<CandidateCard {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Bob Masters").closest("div")!.parentElement!);
    expect(onSelect).toHaveBeenCalledWith(scoredMasters);
  });

  it("clicking hire button calls onAddToTeam", () => {
    const onAddToTeam = jest.fn();
    render(<CandidateCard {...defaultProps} onAddToTeam={onAddToTeam} />);
    fireEvent.click(screen.getByRole("button", { name: /Hire for CTO/i }));
    expect(onAddToTeam).toHaveBeenCalledWith(scoredMasters);
  });

  it("clicking hire button does not call onSelect (stopPropagation)", () => {
    const onSelect = jest.fn();
    const onAddToTeam = jest.fn();
    render(<CandidateCard {...defaultProps} onSelect={onSelect} onAddToTeam={onAddToTeam} />);
    fireEvent.click(screen.getByRole("button", { name: /Hire for CTO/i }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
