import React,{Component} from 'react';
import './bootstrap.min.css';
import RoomSelect from './RoomSelect'

export default class App extends Component{
  render = () => {
    return <div>
      <RoomSelect/>
    </div>
  }
}
