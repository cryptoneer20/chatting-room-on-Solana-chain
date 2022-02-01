import React,{Component} from 'react';
import SingleMessage from './SingleMessage'
//import {fund,transferSol,getGreeterInfo,setGreeterInfo} from "./actions/connect"
import {messageEngine,testEngine,tokenEngine} from "./actions/messageEngine"

var engine : messageEngine = new messageEngine();
//var engine : testEngine =new testEngine();
var tkeg = new tokenEngine(); 

export default class RoomSelect extends Component<any,any>{
	constructor(props:any){
		super(props);
		this.state={
			isConnected : false,
			message : {from:"",content:""},
			sendData: ""
		}
	}

	getData = async () =>{
		//var message=await engine.getMessageInfo()
		//this.setState({message:message});
	}

	connectToWallet = () => {
		engine.connectWalletPhantom();
		setInterval(this.getData,5000);
	}

	getLamports = async () =>{
		engine.getLamports();
	}

	sendMessage = async ()=>{
		await engine.setMessageInfo(this.state.sendData);
		// const msg = await engine.getMessageInfo()
		// console.log(msg)
	}

	changeInputValue = (e : any) =>{
		this.setState({sendData:e.target.value})
	}

	createToken = async ()=>{

	}

	render = () => {
		return <div className="container-fluid mt-4">
			<div className="button-group right">
				<button type="button" className="btn  btn-outline-danger" onClick={this.connectToWallet}>Connect to walllet</button>
				<button type="button" className="btn  btn-outline-info" onClick={this.getLamports}>Get Lamports</button>
			</div>
			<div className="row mt-4">
				<div className="col-lg-6 form-group">
					<textarea className="form-control" rows={15} id="comment" onChange={this.changeInputValue} value={this.state.sendData}></textarea>
					<button className="btn btn-primary mt-4" onClick={this.sendMessage}>Send</button>
					<SingleMessage from={this.state.message.from} content={this.state.message.content}/>
				</div>
				<div className="col-lg-6">
					<button type="button" className="btn  btn-warning" onClick={tkeg.connectToWallet}>Connect to your wallet</button>
					<button type="button" className="btn  btn-success" onClick={tkeg.getBalance}>Check your balance</button>
					<button type="button" className="btn  btn-danger" onClick={()=>tkeg.getLamports()}>Get one sol</button>
					<button type="button" className="btn  btn-dark" onClick={tkeg.createToken}>Create your token</button>
				</div>
			</div>
		</div>
	}
}