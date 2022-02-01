import React,{Component} from 'react';

export default class SingleMessage extends Component<any,any>{
	render = () =>{
		return <div className="mt-4">
			<h6>{this.props.from}</h6>
			<p>{this.props.content}</p>
		</div>
	}
}