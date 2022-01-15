import React,{Component} from 'react'
import {advancedEngine} from '../actions/advancedEngine'
import Bidder from './bidder'
//const engine = new advancedEngine()

export default class AuctionPage extends Component<any,any> {
	engine : advancedEngine
	amounts : any
	auction : any
	auction_extended : any
	constructor(props : any){
		super(props)
		this.state={
			minprice : 100,
			tick : 10,
			reward : 4,
			validAuction : false,
			changeEventFlag : false,
		}
		this.engine = new advancedEngine()
	}
	createAuction = async () => {
		try{
			await this.engine.createAuction(this.state.minprice,this.state.tick,this.state.reward)
			this.amounts=await this.engine.getTokenAmount()
			this.auction=await this.engine.getAuctionData()
			this.auction_extended=await this.engine.getAuctionExtendedData()
			console.log(this.auction_extended)
			console.log(this.auction)
			this.setState({validAuction : true})
		}catch(error){
			console.error(error)
		}
	}
	changeInputValue = (e:any)=>{
		this.setState({[e.target.name]:e.target.value})
	}
	changeEvent = ()=>{
		this.setState({changeEventFlag:!this.state.changeEventFlag})
	}
	placeBid = async (bidder:number,amount : number)=>{
		try{
			await this.engine.placeBid(bidder,amount)
			this.amounts=await this.engine.getTokenAmount()
			this.auction=await this.engine.getAuctionData()
			this.changeEvent()
		}catch(error){
			console.error(error);
		}
		
	}
	cancelBid = async (bidder:number)=>{
		try{
			await this.engine.cancelBid(bidder)
			this.amounts=await this.engine.getTokenAmount()
			this.auction=await this.engine.getAuctionData()
			this.changeEvent()
		}catch(error){
			console.error(error)
		}
		
	}
	render = () => {
		return <div className="container-fluid mt-4">
			<div className="row">
				<div className="col-lg-6">
					<form>
						<div className="input-group mb-3">
							<div className="input-group-prepend">
								<span className="input-group-text">Minimum Price</span>
							</div>
							<input name="minprice" type="number" className="form-control" onChange={this.changeInputValue} value={this.state.minprice}/>
						</div>
						<div className="input-group mb-3">
							<div className="input-group-prepend">
								<span className="input-group-text">Tick size</span>
							</div>
							<input name="tick" type="number" className="form-control" onChange={this.changeInputValue} value={this.state.tick}/>
						</div>
						<div className="input-group mb-3">
							<div className="input-group-prepend">
								<span className="input-group-text">Reward size</span>
							</div>
							<input name="reward" type="number" className="form-control" onChange={this.changeInputValue} value={this.state.reward}/>
						</div>
						<div className="btn-group mb-3">
							<button type="button" className="btn btn-primary" onClick={this.createAuction}>Create Auction</button>
						</div><p>Creating Auction takes minutes. Please wait</p>
					</form>
					{
						(this.state.validAuction || this.auction!=undefined) &&
						<>
							<h5>Auction Data:</h5>
							<p>Auction Authority  :  {this.auction.authority}</p>
							<p>LastBidder  :  {this.auction.bidState.bids.length==0 ? "No Bidder" : this.auction.bidState.bids[0].key}</p>
							<p>Minimum price you can bid : {this.auction.bidState.bids.length==0 ? this.auction.priceFloor.minPrice.words[0] : (Number(this.auction.bidState.bids[0].amount)+Number(this.auction_extended.tickSize.words[0]))}</p>
						</>
					}
					
				</div>
				{ this.state.validAuction &&
				<div className="col-lg-6">
					<Bidder idx='0' title="Person1" own={this.amounts[0].own} place={this.amounts[0].place} placeCallback={this.placeBid} cancelCallback={this.cancelBid}/>
					<Bidder idx='1' title="Person2" own={this.amounts[1].own} place={this.amounts[1].place} placeCallback={this.placeBid} cancelCallback={this.cancelBid}/>	
				</div>
				}
			</div>
		</div>
	}

}