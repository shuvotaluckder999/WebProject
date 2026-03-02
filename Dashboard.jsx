{/*import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"

function Dashboard(){
  const [classes,setClasses]=useState([])
  const [name,setName]=useState("")
  const [code,setCode]=useState("")
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const load = useCallback(async ()=>{
    try{
      const res = await axios.get(
        "http://localhost:5000/api/class/my",
        {headers:{authorization:token}}
      )
      setClasses(res.data)
    }catch(err){
      console.error(err)
    }
  },[token])

  const createClass = async ()=>{
    try{
      await axios.post(
        "http://localhost:5000/api/class/create",
        {name},
        {headers:{authorization:token}}
      )
      load()
      setName("")
    }catch(err){
      console.error(err)
    }
  }

  const joinClass = async ()=>{
    try{
      await axios.post(
        "http://localhost:5000/api/class/join",
        {code},
        {headers:{authorization:token}}
      )
      load()
      setCode("")
    }catch(err){
      console.error(err)
    }
  }

  useEffect(()=>{
    load()
  },[load])

  return(
    <div>
      <h2>Dashboard</h2>

      <input 
        placeholder="Class name" 
        value={name}
        onChange={e=>setName(e.target.value)}
      />
      <button onClick={createClass}>Create</button>

      <input 
        placeholder="Join code" 
        value={code}
        onChange={e=>setCode(e.target.value)}
      />
      <button onClick={joinClass}>Join</button>

      {classes.map(c=>(
        <div 
          key={c._id} 
          onClick={()=>navigate(`/class/${c._id}`)}
          style={{cursor:"pointer", marginTop:"10px"}}
        >
          {c.name} ({c.code})
        </div>
      ))}
    </div>
  )
}

export default Dashboard*/}