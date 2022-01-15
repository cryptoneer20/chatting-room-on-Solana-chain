import React,{Component} from 'react'

export default class Bidder extends Component<any,any> {
	constructor(props : any){
		super(props)
		this.state={
			amount : 0
		}
	}
	changeAmount=(e : any)=>{
		this.setState({amount : e.target.value})
	}
	render = () => {
		return <form>
			<h6>{this.props.title}</h6>
			<p>Own : {this.props.own+"       "}  Place : {this.props.place+"     "} </p>						
			<div className="input-group mb-3">
				<div className="input-group-prepend">
					<span className="input-group-text">amount</span>
				</div>
				<input type="number" className="form-control" onChange={this.changeAmount} value={this.state.amount}/>
			</div>
			<div className="btn-group mb-3">
				<button type="button" className="btn btn-primary" onClick={()=>{this.props.placeCallback(Number(this.props.idx),this.state.amount); this.setState({amount : 0})}}>Place</button>
				{/*<button type="button" className="btn btn-success" onClick={()=>this.props.cancelCallback(Number(this.props.idx))}>Cancel</button>*/}	
			</div>
		</form>
	}
}