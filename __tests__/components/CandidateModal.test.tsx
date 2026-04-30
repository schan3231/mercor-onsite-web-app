import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CandidateModal from "@/components/CandidateModal";
import { scoredPhD, scoredMasters } from "@/__tests__/fixtures/mockCandidates";

const defaultProps = {
  candidate: scoredMasters,
  activeRoleLabel: "CTO",
  activeRoleEmoji: "🛠️",
  bonusSkills: ["React", "TypeScript", "Node JS"],
  isInTeam: false,
  isTeamFull: false,
  onClose: jest.fn(),
  onAddToTeam: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe("CandidateModal — rendering", () => {
  it("renders candidate name", () => {
    render(<CandidateModal {...defaultProps} />);
    expect(screen.getByText("Bob Masters")).toBeInTheDocument();
  });

  it("renders candidate location", () => {
    render(<CandidateModal {...defaultProps} />);
    expect(screen.getByText("Canada")).toBeInTheDocument();
  });

  it("renders all 4 score breakdown factor labels", () => {
    render(<CandidateModal {...defaultProps} />);
    // These labels appear in the score breakdown; some also appear elsewhere, so use getAllByText
    expect(screen.getAllByText("Education").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Experience").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Skills").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Salary Fit")).toBeInTheDocument();
  });

  it("renders score breakdown values", () => {
    render(<CandidateModal {...defaultProps} />);
    // The score breakdown from mockScore has education: 70
    expect(screen.getByText("70/100")).toBeInTheDocument();
  });

  it("renders all 4 rationale bullet points", () => {
    render(<CandidateModal {...defaultProps} />);
    const bullets = screen.getAllByText(/•/);
    expect(bullets.length).toBeGreaterThanOrEqual(4);
  });

  it("renders work experience entries", () => {
    render(<CandidateModal {...defaultProps} />);
    expect(screen.getByText("Shopify")).toBeInTheDocument();
    expect(screen.getByText("Full Stack Developer")).toBeInTheDocument();
  });

  it("renders education entry", () => {
    render(<CandidateModal {...defaultProps} />);
    expect(screen.getByText("University of Toronto")).toBeInTheDocument();
  });

  it("renders all skills as chips", () => {
    render(<CandidateModal {...defaultProps} />);
    for (const skill of scoredMasters.skills) {
      expect(screen.getAllByText(skill).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("bonus skills have indigo styling", () => {
    render(<CandidateModal {...defaultProps} bonusSkills={["React"]} />);
    // Find React chip in skills section (last one, in the skills section)
    const reactElements = screen.getAllByText("React");
    const indigoOne = reactElements.find((el) =>
      el.className.includes("indigo")
    );
    expect(indigoOne).toBeDefined();
  });

  it("non-bonus skills have gray styling", () => {
    render(<CandidateModal {...defaultProps} bonusSkills={["React"]} />);
    const dockerElements = screen.queryAllByText("Docker");
    if (dockerElements.length > 0) {
      expect(dockerElements[0]).toHaveClass("bg-gray-100");
    }
  });

  it("shows top-50 badge on top-50 school degree", () => {
    render(<CandidateModal {...defaultProps} candidate={scoredPhD} />);
    expect(screen.getByText("Top 50")).toBeInTheDocument();
  });
});

describe("CandidateModal — hire button states", () => {
  it("shows 'Hire as CTO' button when not in team", () => {
    render(<CandidateModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Hire as CTO/i })).toBeInTheDocument();
  });

  it("shows 'Remove from team' when candidate is in team", () => {
    render(<CandidateModal {...defaultProps} isInTeam />);
    expect(screen.getByRole("button", { name: /Remove from team/i })).toBeInTheDocument();
  });

  it("button is disabled and shows 'Team is full' when team is full and not in team", () => {
    render(<CandidateModal {...defaultProps} isTeamFull isInTeam={false} />);
    const btn = screen.getByRole("button", { name: /Team is full/i });
    expect(btn).toBeDisabled();
  });

  it("clicking hire button calls onAddToTeam and onClose", () => {
    const onAddToTeam = jest.fn();
    const onClose = jest.fn();
    render(<CandidateModal {...defaultProps} onAddToTeam={onAddToTeam} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Hire as CTO/i }));
    expect(onAddToTeam).toHaveBeenCalledWith(scoredMasters);
    expect(onClose).toHaveBeenCalled();
  });

  it("role emoji appears in the hire button", () => {
    render(<CandidateModal {...defaultProps} activeRoleEmoji="🛠️" />);
    const btn = screen.getByRole("button", { name: /Hire as CTO/i });
    expect(btn.textContent).toContain("🛠️");
  });
});

describe("CandidateModal — close behaviors", () => {
  it("clicking the × button calls onClose", () => {
    const onClose = jest.fn();
    render(<CandidateModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalled();
  });

  it("pressing Escape calls onClose", async () => {
    const onClose = jest.fn();
    render(<CandidateModal {...defaultProps} onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("clicking the backdrop calls onClose", () => {
    const onClose = jest.fn();
    const { container } = render(<CandidateModal {...defaultProps} onClose={onClose} />);
    // The backdrop is the outermost div
    fireEvent.click(container.firstChild!);
    expect(onClose).toHaveBeenCalled();
  });

  it("clicking inside the modal does not call onClose", () => {
    const onClose = jest.fn();
    render(<CandidateModal {...defaultProps} onClose={onClose} />);
    // Click the candidate name (inside modal)
    fireEvent.click(screen.getByText("Bob Masters"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
