import "./statcard.css";

export default function StatCard({title,value,color}){

    return(

        <div className="stat-card">

            <div
            className="circle"
            style={{background:color}}
            ></div>

            <h3>{value}</h3>

            <p>{title}</p>

        </div>

    )

}