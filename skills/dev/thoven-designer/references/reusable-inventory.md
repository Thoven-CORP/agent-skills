# Thoven Reusable Component Inventory

Catalog of existing components that can be reused or extended.

---

## UI Primitives (`components/ui/`)

Base components built on Radix UI primitives.

### Form Components
| Component | Path | Usage |
|-----------|------|-------|
| `Button` | `components/ui/button.tsx` | Primary button variants |
| `Input` | `components/ui/input.tsx` | Text input field |
| `Label` | `components/ui/label.tsx` | Form labels |
| `Textarea` | `components/ui/textarea.tsx` | Multi-line input |
| `Select` | `components/ui/select.tsx` | Dropdown select |
| `Checkbox` | `components/ui/checkbox.tsx` | Checkbox input |
| `RadioGroup` | `components/ui/radio-group.tsx` | Radio button group |
| `Switch` | `components/ui/switch.tsx` | Toggle switch |

### Layout Components
| Component | Path | Usage |
|-----------|------|-------|
| `Card` | `components/ui/card.tsx` | Card container with header/content |
| `Accordion` | `components/ui/accordion.tsx` | Expandable sections |
| `Tabs` | `components/ui/tabs.tsx` | Tab navigation |
| `Sheet` | `components/ui/sheet.tsx` | Slide-out panel |
| `Sidebar` | `components/ui/sidebar.tsx` | Navigation sidebar |
| `Separator` | `components/ui/separator.tsx` | Horizontal/vertical divider |

### Interactive Components
| Component | Path | Usage |
|-----------|------|-------|
| `Dialog` | `components/ui/dialog.tsx` | Modal dialogs |
| `DropdownMenu` | `components/ui/dropdown-menu.tsx` | Dropdown menus |
| `Popover` | `components/ui/popover.tsx` | Floating content |
| `Tooltip` | `components/ui/tooltip.tsx` | Hover tooltips |
| `NavigationMenu` | `components/ui/navigation-menu.tsx` | Nav menus |
| `Command` | `components/ui/command.tsx` | Command palette |

### Feedback Components
| Component | Path | Usage |
|-----------|------|-------|
| `Badge` | `components/ui/badge.tsx` | Status badges |
| `Alert` | `components/ui/alert.tsx` | Alert messages |
| `Progress` | `components/ui/progress.tsx` | Progress bar |
| `Skeleton` | `components/ui/skeleton.tsx` | Loading placeholder |
| `Toast` | `components/ui/toast.tsx` | Toast notifications |

### Special Components
| Component | Path | Usage |
|-----------|------|-------|
| `DatePicker` | `components/ui/date-picker.tsx` | Date selection |
| `FloatingPanel` | `components/ui/floating-panel.tsx` | Spring-animated panel |
| `PhoneInputSimple` | `components/ui/PhoneInputSimple.tsx` | Phone number input |
| `ParentAddressInput` | `components/ui/ParentAddressInput.tsx` | Address autocomplete |
| `Confetti` | `components/ui/confetti.tsx` | Celebration animation |
| `Typewriter` | `components/ui/typewriter.tsx` | Typing effect |
| `WhiteOutlineButton` | _Pattern documented; not yet implemented in `components/ui/`_ | Square 3D tile for calm grids of equal-weight options (e.g., 4-up format pickers). White center, grey outline, grey 3D ledge at the standard `4→2→1px` depth, escalates to the selected tertiary hue on `:active`. See `.claude/skills/thoven-designer/references/component-patterns.md` → "Thoven 3D Button — White Outline Variant" |

---

## Landing Components (`components/landing/`)

Well-designed components for marketing pages.

| Component | Path | Usage |
|-----------|------|-------|
| `BouncyCardsFeatures` | `components/landing/BouncyCardsFeatures.tsx` | Animated feature cards grid |
| `TeacherBouncyCards` | `components/landing/TeacherBouncyCards.tsx` | Teacher feature cards |
| `TeacherCarousel` | `components/landing/TeacherCarousel.tsx` | Embla carousel for teachers |
| `TeacherCarouselCard` | `components/landing/TeacherCarouselCard.tsx` | Teacher profile card |
| `ValuePropositionBlock` | `components/landing/ValuePropositionBlock.tsx` | Icon + title + description block |
| `PlatformFeaturesBlock` | `components/landing/PlatformFeaturesBlock.tsx` | Feature showcase section |
| `LearnerLandingV2` | `components/learner-landing-v2.tsx` | Learner landing section |
| `TeacherLanding` | `components/teacher-landing.tsx` | Teacher landing section |

---

## Shared Components (`components/shared/`)

Cross-role reusable components.

| Component | Path | Usage |
|-----------|------|-------|
| `GoogleCalendarCard` | `components/shared/GoogleCalendarCard.tsx` | Calendar integration |
| `DenyReasonModal` | `components/shared/DenyReasonModal.tsx` | Denial reason input |

---

## Navigation Components (`components/nav/`)

| Component | Path | Usage |
|-----------|------|-------|
| `UnifiedNavigation` | `components/unified-navigation.tsx` | Main navigation (3 variants) |
| `ParentSignupFloatingPanel` | `components/parent-signup-floating-panel.tsx` | Multi-step signup |
| `SignInModal` | `components/sign-in-modal.tsx` | Authentication modal |

---

## Teacher Components (`components/teacher/`)

Reusable patterns from teacher dashboard.

### Cards
| Component | Path | Usage |
|-----------|------|-------|
| `UpcomingLessonCard` | `components/teacher/UpcomingLessonCard.tsx` | Lesson preview card |
| `BookingRequestCard` | `components/teacher/BookingRequestCard.tsx` | Booking request item |
| `MorphingSessionCard` | `components/teacher/sessions/MorphingSessionCard.tsx` | Animated session card |
| `MorphingMaterialCard` | `components/teacher/class-materials/MorphingMaterialCard.tsx` | Material card with animation |

### Panels
| Component | Path | Usage |
|-----------|------|-------|
| `UpcomingLessonsPanel` | `components/teacher/UpcomingLessonsPanel.tsx` | Infinite scroll lessons |
| `ManageLessonPackagesFloatingPanel` | `components/teacher/packages/ManageLessonPackagesFloatingPanel.tsx` | Package management |

### Sections
| Component | Path | Usage |
|-----------|------|-------|
| `CalendarSection` | `components/teacher/CalendarSection.tsx` | Multi-view calendar |
| `ModernCalendar` | `components/teacher/ModernCalendar.tsx` | Calendar with 3 views |

---

## Parent Components (`components/parent/`)

Reusable patterns from parent dashboard.

### Cards
| Component | Path | Usage |
|-----------|------|-------|
| `StudentCard` | Various | Student profile card |
| `ClassCard` | Various | Class info card |

### Modals
| Component | Path | Usage |
|-----------|------|-------|
| `AddStudentModal` | `components/add-student-modal.tsx` | COPPA-compliant student creation |
| `PurchaseModal` | Various | Credit purchase flow |

---

## Student Components (`components/student/`)

Components for student dashboard.

| Component | Path | Usage |
|-----------|------|-------|
| `XpThermometer` | `components/student/XpThermometer.tsx` | XP progress visualization |
| `CalendarLessonCard` | `components/student/CalendarLessonCard.tsx` | Upcoming lesson card |
| `StudentMaterialsPanel` | `components/student/StudentMaterialsPanel.tsx` | Materials floating panel |
| `StudentAssignmentsPanel` | `components/student/StudentAssignmentsPanel.tsx` | Assignments floating panel |
| `YourClassesModal` | `components/student/YourClassesModal.tsx` | Classes modal |

---

## Common Patterns to Reuse

### Empty State Pattern
Found in: Most list/grid components
```tsx
// Look for *Empty.tsx or empty state within components
// Example: HomeworkBoxEmpty, ClassMaterialsBoxFilled patterns
```

### Loading State Pattern
Found in: Dashboard sections
```tsx
// Skeleton placeholders with animate-pulse
// IntersectionObserver for infinite scroll
```

### Modal Pattern
Found in: *Modal.tsx files
```tsx
// Radix Dialog with spring animation
// Consistent header/body/footer structure
```

### Card Pattern
Found in: *Card.tsx files
```tsx
// White background, gray border, rounded-lg
// Optional hover shadow lift
// Consistent padding scale
```

---

## How to Reuse

### Option 1: Direct Import
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
```

### Option 2: Extend Pattern
Copy the pattern structure but customize:
- Colors (use Thoven palette)
- Typography (follow font rules)
- Animation (use spring parameters)

### Option 3: Compose
Combine existing components:
```tsx
<Card>
  <CardHeader>
    <h3 className="font-display font-bold">{title}</h3>
  </CardHeader>
  <CardContent>
    <Button variant="primary">Action</Button>
  </CardContent>
</Card>
```

---

## When to Create New

Create new components only when:
1. No similar component exists in the inventory
2. Existing components can't be reasonably extended
3. The pattern will be reused 3+ times
4. Significant new functionality is needed

Always check this inventory first before creating new components!
