/*import "./sidebar.css";
import { NavLink } from "react-router-dom";
import {
MdDashboard,
MdPeople,
MdSchool,
MdNotifications,
MdSettings,
MdDescription,
MdPerson
} from "react-icons/md";

export default function Sidebar(){

return(

<div className="sidebar">

<h2>CampusOne AI</h2>

<ul>

<li><MdDashboard/> Dashboard</li>

<NavLink to="/admin/students" className="menu-link"><li><MdPeople/> Students</li></NavLink>

<NavLink to="/admin/faculty" className="menu-link"><li><MdSchool/> Faculty</li> </NavLink>

<NavLink to="/admin/certificates" className="menu-link"><li><MdDescription/> Certificates</li></NavLink>

<NavLink to="/admin/notifications" className="menu-link"><li><MdNotifications/> Notifications</li></NavLink>

<NavLink to="/admin/settings" className="menu-link"><li><MdSettings/> Settings</li></NavLink>

<NavLink to="/admin/profile" className="menu-link"><li><MdPerson /> Profile </li></NavLink>

</ul>

</div>

)

}*/

import { NavLink } from "react-router-dom";

import {
  MdDashboard,
  MdPeople,
  MdSchool,
  MdDescription,
  MdNotifications,
  MdBarChart,
  MdSettings,
  MdPerson
} from "react-icons/md";

import "./sidebar.css";

export default function Sidebar() {

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <MdDashboard />
    },
    {
      name: "Students",
      path: "/admin/students",
      icon: <MdPeople />
    },
    {
      name: "Faculty",
      path: "/admin/faculty",
      icon: <MdSchool />
    },
    {
      name: "Certificates",
      path: "/admin/certificates",
      icon: <MdDescription />
    },
    {
      name: "Notifications",
      path: "/admin/notifications",
      icon: <MdNotifications />
    },
    
    {
      name: "Settings",
      path: "/admin/settings",
      icon: <MdSettings />
    },
    {
      name: "Profile",
      path: "/admin/profile",
      icon: <MdPerson />
    }
  ];

  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        <h2>CampusOne AI</h2>
      </div>

      <nav className="sidebar-menu">

        {menuItems.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "menu-link active"
                : "menu-link"
            }
          >

            <span className="menu-icon">
              {item.icon}
            </span>

            <span>{item.name}</span>

          </NavLink>

        ))}

      </nav>

    </aside>
  );
}

