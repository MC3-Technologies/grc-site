import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const AdminLayout = ({
  children,
  activeSection,
  setActiveSection,
}: AdminLayoutProps) => {
  return (
    <div className="flex">
      <AdminSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      <main className="flex-1 p-4">{children}</main>
    </div>
  );
};

export default AdminLayout;
