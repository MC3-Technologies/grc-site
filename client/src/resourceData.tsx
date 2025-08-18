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

// ADD A NEW RESOURCE BY:
// 1. Create new type for the resource under this comment block -- use CMMC level 1 as reference
// 2. Add new resource type to the ResourcesUnion within the <>
// 3. Create resource in the resources map at the bottom of this file calling the createResourceEntry
//    function and passing in your resource instance -- use the Resource type above for some reference
type CMMCLevel1 = {
  temp: string;
};

export type ResourcesUnion = Resource<CMMCLevel1>;

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
    data: { temp: "hwello" },
    displayData() {
      return <></>;
    },
  }),
]);

export default resources;
