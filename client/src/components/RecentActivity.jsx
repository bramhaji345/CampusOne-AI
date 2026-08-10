import "./recent.css";

function RecentActivity() {

  const activities = [

    {
      title:"Attendance Uploaded",
      time:"5 Minutes Ago"
    },

    {
      title:"New Student Registered",
      time:"10 Minutes Ago"
    },

    {
      title:"Faculty Added",
      time:"30 Minutes Ago"
    },

    {
      title:"Semester Results Published",
      time:"1 Hour Ago"
    },

    {
      title:"Certificate Approved",
      time:"Today"
    }

  ];

  return (

    <div>

      <div className="activity-title">

        Recent Activities

      </div>

      <ul className="activity-list">

        {activities.map((item,index)=>(

          <li key={index}>

            <strong>{item.title}</strong>

            <span className="time">
              {item.time}
            </span>

          </li>

        ))}

      </ul>

    </div>

  );

}

export default RecentActivity;