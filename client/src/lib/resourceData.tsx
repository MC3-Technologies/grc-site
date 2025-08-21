// ******* CREATING A NEW RESOURCE ********
// 1. Create resource typescript data file in /client/src/data/resources named with your new resource
// 2. Within in resource data file, create and export the display data of the resource, can be of any defined
//    type -- refer to /client/src/data/resources/cmmcLevel1.ts
// 3. Import resource display data under to this file and add the data type to the ResourcesUnion variable using
//    using "typeof" of your data
// 4. Add a new entry to the resources map at the bottom of this file, use the createResourceEntry function
//    passing in your a resource instance where your data attribute is the data you imported and the displayData
//    being the function on how to display the data -- should return JSX

import cmmcLevel1Data from "../data/resources/cmmcLevel1";

export type Resource<T> = {
  name: string; // Name of resource that will be displayed in resources drop down
  readonly slug: string; // Will return slugged version of the resource name, handles routing for resource
  data: T; // Data that needs to be displayed
  displayData: () => JSX.Element; // Function to turn the above display data into displayable JSX
};

const slug = (str: string): string => {
  str = str.replace(/^\s+|\s+$/g, "");
  str = str.toLowerCase();
  str = str
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return str;
};

export type ResourcesUnion = Resource<typeof cmmcLevel1Data>;

function createResourceEntry(
  resource: ResourcesUnion
): [string, ResourcesUnion] {
  return [resource.slug, resource];
}

const resources = new Map<string, ResourcesUnion>([
  createResourceEntry({
    name: "CMMC Level 1",
    get slug() {
      return slug(this.name);
    },
    data: cmmcLevel1Data,
    displayData() {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 my-4">
          {this.data.map((val, key) => (
            <div
              className="text-left p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700"
              key={key}
            >
              <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {val.controlId}
              </h5>

              {/* Requirement sections */}
              <div className="mb-2 md:text-base text-sm">
                <h5 className=" font-bold tracking-tight text-gray-900 dark:text-white">
                  Requirement
                </h5>
                <div className="font-normal text-gray-700 dark:text-gray-400">
                  <p>{val.requirement}</p>
                  <p>{val.plainEnglish}</p>
                </div>
              </div>

              {/* Question asked section */}
              <div className="mb-2 md:text-base text-sm">
                <h5 className="font-bold tracking-tight text-gray-900 dark:text-white">
                  Questions Asked
                </h5>
                <ul className="font-normal text-gray-700 dark:text-gray-400 list-disc ml-5">
                  {val.assessmentQuestions.map((val2, key2) => (
                    <li key={key2}>{val2}</li>
                  ))}
                </ul>
              </div>

              {/* POAM sectopm */}
              <div className="mb-2 md:text-base text-sm">
                <h5 className="font-bold tracking-tight text-gray-900 dark:text-white">
                  Plan of Action & Milestones
                </h5>
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  {val.poam}
                </p>
              </div>

              {/* Remediation guidance */}
              <div className="mb-2 md:text-base text-sm">
                <h5 className=" font-bold tracking-tight text-gray-900 dark:text-white">
                  Remediation Guidance
                </h5>
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  {val.remediationGuidance}
                </p>
              </div>

              {/* Evidence */}
              <div className="mb-2 md:text-base text-sm">
                <h5 className="font-bold tracking-tight text-gray-900 dark:text-white">
                  Evidence
                </h5>
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  {val.evidence}
                </p>
              </div>

              {/* Policy */}
              <div className="md:text-base text-sm">
                <h5 className="font-bold tracking-tight text-gray-900 dark:text-white">
                  Policy
                </h5>
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  {val.policy}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    },
  }),
]);

export default resources;
