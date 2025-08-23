// ******* CREATING A NEW RESOURCE ********
// 1. Create a resource TypeScript data file in /client/src/data/resources named after your new resource.
// 2. In that file, export the display data for the resource (any defined type). See /client/src/data/resources/cmmcLevel1.ts
// 3. Import the display data here and add its type to the ReportsUnion using "typeof" on the data export.
// 4. Add a new entry to the resources map at the bottom of this file. The entry's value should include
//    the resource version, the imported data, and a displayData() function that returns JSX.

import {
  Report as CmmcLevel1v1dot1dot0ReportClass,
  ReportResult as CmmcLevel1v1dot1dot0ReportResult,
} from "../data/assessments/cmmcLevel1/v1.1.0";

export type Report<T> = {
  getReportData: (assessmentData: string) => T;
  displayReport: (reportData: T) => JSX.Element;
};

export type ReportsUnion = Report<CmmcLevel1v1dot1dot0ReportResult>;

// Control compliance status helper function, returns a badge component that indicates control compliance
const getControlComplianceStatusComponent = (
  score: number,
  maxScore: number,
): JSX.Element => {
  if (score === maxScore) {
    return (
      <p className="font-bold text-green-600 dark:text-green-400">
        {" "}
        Implemented{" "}
      </p>
    );
  } else if (score > 0 && score < maxScore) {
    return (
      <p className="font-bold text-yellow-600 dark:text-yellow-400">
        {" "}
        Partially Implemented{" "}
      </p>
    );
  } else {
    return (
      <p className="font-bold text-red-600 dark:text-red-400">
        {" "}
        Not Implemented{" "}
      </p>
    );
  }
};

const reports = new Map<string, ReportsUnion>([
  [
    "cmmc-level-1:1.1.0",
    {
      getReportData(assessmentData: string) {
        const report = new CmmcLevel1v1dot1dot0ReportClass(assessmentData);
        const reportData = report.generateReportData();
        return reportData;
      },
      displayReport(assessmentReportData: CmmcLevel1v1dot1dot0ReportResult) {
        return (
          <>
            {/* Assessment onboarding data section */}
            <div className="grid grid-cols-1 gap-5">
              <div className="block w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm  dark:bg-gray-800 dark:border-gray-700 ">
                <h5 className=" text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Organization Onboarding
                </h5>
                <p className="font-normal mb-4 text-gray-700 dark:text-gray-400">
                  This table details your organization's onboarding information.
                </p>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Question
                        </th>

                        <th
                          scope="col"
                          className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Answer
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessmentReportData.onboardingResults.map(
                        (val, key) => (
                          <tr className="bg-white dark:bg-gray-800" key={key}>
                            <td scope="row" className="px-3 pt-2">
                              {val.question}
                            </td>

                            <th className="px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                              {val.answer}
                            </th>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* List of controls and adherence table data section */}
            <div className="grid grid-cols-1 gap-5 my-4">
              <div className="block w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm  dark:bg-gray-800 dark:border-gray-700 ">
                <h5 className=" text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Detailed Report
                </h5>
                <p className="font-normal mb-4 text-gray-700 dark:text-gray-400">
                  This table details your organization's compliance status with
                  the specific controls of CMMC level 1. This status is based on
                  information provided by you about your organization from your
                  assessment.
                </p>
                {/* Assessment scoring and adherence percentage section */}
                <div className="grid grid-cols-2 gap-3  md:mx-0 mx-2 pb-5">
                  <div className="block  p-4 bg-white border border-gray-200 rounded-lg shadow-sm  dark:bg-gray-800 dark:border-gray-700 ">
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                      Assessment Score
                    </p>
                    <h5 className=" text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                      {assessmentReportData.score} /{" "}
                      {assessmentReportData.maxScore}
                    </h5>
                  </div>
                  <div className="block  p-4 bg-white border border-gray-200 rounded-lg shadow-sm  dark:bg-gray-800 dark:border-gray-700 ">
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                      % Adherent
                    </p>
                    <h5 className=" text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                      {Math.round(
                        (assessmentReportData.score /
                          assessmentReportData.maxScore) *
                          100,
                      )}
                      %
                    </h5>
                  </div>
                </div>

                {/* List of controls and adherence table data */}
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Control Group
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Control Group Score
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Control Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ...assessmentReportData.controlGroupResults.entries(),
                      ].map(([controlGroupKey, controlGroupVal]) => (
                        <>
                          <tr
                            className="bg-white dark:bg-gray-800"
                            key={controlGroupKey}
                          >
                            <th
                              scope="row"
                              className="px-3 pt-3 font-semibold text-base text-gray-900 whitespace-nowrap dark:text-white"
                            >
                              {controlGroupKey}
                            </th>

                            <th
                              scope="row"
                              className="px-3 pt-3 font-semibold text-base text-gray-900 whitespace-nowrap dark:text-white"
                            >
                              {controlGroupVal.score} /{" "}
                              {controlGroupVal.maxScore}
                            </th>
                            <td className="px-6 pt-3 font-semibold text-base">
                              {getControlComplianceStatusComponent(
                                controlGroupVal.score,
                                controlGroupVal.maxScore,
                              )}
                            </td>
                          </tr>

                          {controlGroupVal.questionAnswers.map((qa, idx) => (
                            <>
                              <tr key={idx}>
                                <td colSpan={2} key={idx} className="px-3">
                                  <p>{qa.question}</p>
                                </td>
                                <td colSpan={1} key={idx} className="px-6 ">
                                  <p>{qa.answer}</p>
                                </td>
                              </tr>
                              {qa.followUp && (
                                <>
                                  <tr key={idx}>
                                    <td colSpan={2} key={idx} className="px-3">
                                      <p>Follow up: {qa.followUp.question}</p>
                                    </td>
                                    <td colSpan={1} key={idx} className="px-6 ">
                                      <p>{qa.followUp.answer}</p>
                                    </td>
                                  </tr>
                                </>
                              )}
                            </>
                          ))}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* List of non adherent controls */}
            {assessmentReportData.score !== assessmentReportData.maxScore && (
              <div className="grid grid-cols-1 gap-5 my-4">
                <div className="block w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm  dark:bg-gray-800 dark:border-gray-700 ">
                  <h5 className=" text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
                    Control Action Items
                  </h5>
                  <p className="font-normal mb-1 text-gray-700 dark:text-gray-400">
                    This table details your organization's focus areas to become
                    fully adherent to CMMC level 1.
                  </p>

                  <p className="font-large mb-4 text-gray-700 dark:text-gray-400 font-bold">
                    Click{" "}
                    <a
                      target="_blank"
                      href="/resources/?resource=cmmc-level-1"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      here
                    </a>{" "}
                    to view how to implement CMMC controls.
                  </p>
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th
                            scope="col"
                            className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                          >
                            Control Group
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                          >
                            Control Group Score
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                          >
                            Control Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ...assessmentReportData.controlGroupResults.entries(),
                        ].map(([controlGroupKey, controlGroupVal]) => (
                          <>
                            {controlGroupVal.score !=
                              controlGroupVal.maxScore && (
                              <>
                                <tr
                                  className="bg-white dark:bg-gray-800"
                                  key={controlGroupKey}
                                >
                                  <th
                                    scope="row"
                                    className="px-3 pt-3 font-semibold text-base text-gray-900 whitespace-nowrap dark:text-white"
                                  >
                                    {controlGroupKey}
                                  </th>

                                  <th
                                    scope="row"
                                    className="px-3 pt-3 font-semibold text-base text-gray-900 whitespace-nowrap dark:text-white"
                                  >
                                    {controlGroupVal.score} /{" "}
                                    {controlGroupVal.maxScore}
                                  </th>
                                  <td className="px-6 pt-3 font-semibold text-base">
                                    {getControlComplianceStatusComponent(
                                      controlGroupVal.score,
                                      controlGroupVal.maxScore,
                                    )}
                                  </td>
                                </tr>

                                {controlGroupVal.questionAnswers.map(
                                  (qa, idx) => (
                                    <>
                                      <tr key={idx}>
                                        <td
                                          colSpan={2}
                                          key={idx}
                                          className="px-3"
                                        >
                                          <p>{qa.question}</p>
                                        </td>
                                        <td
                                          colSpan={1}
                                          key={idx}
                                          className="px-6 "
                                        >
                                          <p>{qa.answer}</p>
                                        </td>
                                      </tr>
                                    </>
                                  ),
                                )}
                              </>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      },
    },
  ],
]);

export default reports;
