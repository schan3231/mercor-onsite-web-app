import { render, screen, fireEvent } from "@testing-library/react";
import TeamPanel from "@/components/TeamPanel";
import { DEFAULT_TEAM_SLOTS } from "@/lib/presets";
import { TeamSlot } from "@/lib/types";
import { scoredMasters, scoredDesigner } from "@/__tests__/fixtures/mockCandidates";
import { useRouter } from "next/navigation";

const emptySlots: TeamSlot[] = DEFAULT_TEAM_SLOTS.map((s) => ({ ...s, candidate: null }));

function fillAllSlots(): TeamSlot[] {
  return DEFAULT_TEAM_SLOTS.map((s, i) => ({
    ...s,
    candidate: { ...scoredMasters, id: i, name: `Hire ${i}`, location: `Country${i}` },
  }));
}

const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
});

describe("TeamPanel — rendering", () => {
  it("renders 5 role slots", () => {
    render(<TeamPanel slots={emptySlots} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText("CEO")).toBeInTheDocument();
    expect(screen.getByText("CTO")).toBeInTheDocument();
    expect(screen.getByText("Senior Engineer")).toBeInTheDocument();
    expect(screen.getByText("Product Designer")).toBeInTheDocument();
    expect(screen.getByText("Data / ML")).toBeInTheDocument();
  });

  it("empty slots show 'Empty' placeholder text", () => {
    render(<TeamPanel slots={emptySlots} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getAllByText(/Empty/i).length).toBeGreaterThan(0);
  });

  it("active slot has indigo border class", () => {
    const { container } = render(
      <TeamPanel slots={emptySlots} activeSlotIndex={1} onSlotClick={jest.fn()} onRemove={jest.fn()} />
    );
    const slots = container.querySelectorAll(".border-indigo-400");
    expect(slots.length).toBeGreaterThanOrEqual(1);
  });
});

describe("TeamPanel — interactions", () => {
  it("clicking a slot calls onSlotClick with the correct index", () => {
    const onSlotClick = jest.fn();
    render(<TeamPanel slots={emptySlots} activeSlotIndex={0} onSlotClick={onSlotClick} onRemove={jest.fn()} />);
    // Click the CTO slot (index 1)
    fireEvent.click(screen.getByText("CTO").closest("[class]")!);
    expect(onSlotClick).toHaveBeenCalledWith(1);
  });

  it("filled slot shows candidate name", () => {
    const withOne: TeamSlot[] = emptySlots.map((s, i) =>
      i === 0 ? { ...s, candidate: scoredMasters } : s
    );
    render(<TeamPanel slots={withOne} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText("Bob Masters")).toBeInTheDocument();
  });

  it("clicking × on a filled slot calls onRemove with that index", () => {
    const onRemove = jest.fn();
    const withOne: TeamSlot[] = emptySlots.map((s, i) =>
      i === 0 ? { ...s, candidate: scoredMasters } : s
    );
    render(<TeamPanel slots={withOne} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={onRemove} />);
    fireEvent.click(screen.getByTitle("Remove"));
    expect(onRemove).toHaveBeenCalledWith(0);
  });
});

describe("TeamPanel — summary button", () => {
  it("'View Team Summary' button is disabled when fewer than 5 slots are filled", () => {
    render(<TeamPanel slots={emptySlots} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={jest.fn()} />);
    const btn = screen.getByRole("button", { name: /Fill/i });
    expect(btn).toBeDisabled();
  });

  it("shows 'View Team Summary' button when all 5 slots are filled", () => {
    render(<TeamPanel slots={fillAllSlots()} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByRole("button", { name: /View Team Summary/i })).toBeInTheDocument();
  });

  it("'View Team Summary' button is enabled when all 5 slots are filled", () => {
    render(<TeamPanel slots={fillAllSlots()} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={jest.fn()} />);
    const btn = screen.getByRole("button", { name: /View Team Summary/i });
    expect(btn).not.toBeDisabled();
  });

  it("clicking 'View Team Summary' saves to sessionStorage", () => {
    render(<TeamPanel slots={fillAllSlots()} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /View Team Summary/i }));
    expect(sessionStorage.getItem("hiredTeam")).toBeTruthy();
  });

  it("clicking 'View Team Summary' navigates to /team", () => {
    render(<TeamPanel slots={fillAllSlots()} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /View Team Summary/i }));
    expect(mockPush).toHaveBeenCalledWith("/team");
  });
});

describe("TeamPanel — team stats (shown with 2+ filled slots)", () => {
  const twoFilled: TeamSlot[] = emptySlots.map((s, i) => {
    if (i === 0) return { ...s, candidate: { ...scoredMasters, location: "United States" } };
    if (i === 1) return { ...s, candidate: { ...scoredDesigner, location: "Germany", id: 99 } };
    return s;
  });

  it("shows team stats section when 2+ slots are filled", () => {
    render(<TeamPanel slots={twoFilled} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText("Team Stats")).toBeInTheDocument();
  });

  it("does not show stats section when fewer than 2 slots are filled", () => {
    render(<TeamPanel slots={emptySlots} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.queryByText("Team Stats")).not.toBeInTheDocument();
  });

  it("shows countries count for geographic diversity", () => {
    render(<TeamPanel slots={twoFilled} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText("2 countries")).toBeInTheDocument();
  });

  it("shows unique skills count", () => {
    render(<TeamPanel slots={twoFilled} activeSlotIndex={0} onSlotClick={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText(/Unique skills/i)).toBeInTheDocument();
  });
});
