import {
  redirectHome,
  redirectToSignIn,
  redirectToAssessments,
  redirectToInProgressAssessment,
  redirectToCompletedAssessment,
} from "../routing";

interface LocationMock {
  _href: string;
  href: string;
  assign: jest.Mock;
  replace: jest.Mock;
  reload: jest.Mock;
  toString: jest.Mock;
  ancestorOrigins: DOMStringList;
  origin: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
}

describe("Routing utils", () => {
  // Store original window.location
  let originalLocation: Location;

  beforeEach(() => {
    // Save original window.location
    originalLocation = window.location;

    // Create a mock for window.location with working assign and replace methods
    const locationMock: LocationMock = {
      _href: "https://example.com/current-page",
      get href() {
        return this._href;
      },
      set href(value) {
        this._href = value;
      },
      assign: jest.fn((url: string) => {
        // Properly handle URL encoding in the mock
        locationMock._href = url;
      }),
      replace: jest.fn((url: string) => {
        // Properly handle URL encoding in the mock
        locationMock._href = url;
      }),
      reload: jest.fn(),
      toString: jest.fn(() => locationMock._href),
      ancestorOrigins: {} as DOMStringList,
      origin: "https://example.com",
      protocol: "https:",
      host: "example.com",
      hostname: "example.com",
      port: "",
      pathname: "/current-page",
      search: "",
      hash: "",
    };

    Object.defineProperty(window, "location", {
      writable: true,
      value: locationMock,
    });
  });

  afterEach(() => {
    // Restore window.location
    window.location = originalLocation;
  });

  test("redirectHome should redirect to home page", () => {
    // Act
    redirectHome();

    // Assert
    expect(window.location.href).toBe("/");
  });

  test("redirectToSignIn should redirect to sign-in page", () => {
    // Act
    redirectToSignIn();

    // Assert
    expect(window.location.href).toBe("/auth/?tab=sign-in");
  });

  test("redirectToAssessments should redirect to assessments page", () => {
    // Act
    redirectToAssessments();

    // Assert
    expect(window.location.href).toBe("/assessments/");
  });

  test("redirectToInProgressAssessment should redirect to assessment page with ID", () => {
    // Arrange
    const testAssessmentId = "test-assessment-id";

    // Act
    redirectToInProgressAssessment(testAssessmentId);

    // Assert
    expect(window.location.href).toBe(
      `/assessment/?assessment-id=${testAssessmentId}`,
    );
  });

  test("redirectToCompletedAssessment should redirect to completed assessment page with ID", () => {
    // Arrange
    const testAssessmentId = "test-assessment-id";

    // Act
    redirectToCompletedAssessment(testAssessmentId);

    // Assert
    expect(window.location.href).toBe(
      `/completed-assessment/?assessment-id=${testAssessmentId}`,
    );
  });

  test("redirectToInProgressAssessment should encode assessment ID", () => {
    // Setup
    const specialId = "test id with spaces & special chars?";
    const encodedId = encodeURIComponent(specialId);

    // Act
    redirectToInProgressAssessment(specialId);

    // Assert - directly check the href value which should contain the encoded ID
    expect(window.location.href).toBe(
      `/assessment/?assessment-id=${encodedId}`,
    );
  });

  test("redirectToCompletedAssessment should encode assessment ID", () => {
    // Setup
    const specialId = "test id with spaces & special chars?";
    const encodedId = encodeURIComponent(specialId);

    // Act
    redirectToCompletedAssessment(specialId);

    // Assert - directly check the href value which should contain the encoded ID
    expect(window.location.href).toBe(
      `/completed-assessment/?assessment-id=${encodedId}`,
    );
  });
});
