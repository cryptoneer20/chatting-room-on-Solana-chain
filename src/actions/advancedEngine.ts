import {
	Connection,
	PublicKey,
	LAMPORTS_PER_SOL,
	Keypair,
	SystemProgram,
	Transaction,
	sendAndConfirmTransaction,
	TransactionInstruction
} from '@solana/web3.js'
import * as splToken from '@solana/spl-token'
import Wallet from '@project-serum/sol-wallet-adapter'
import {Buffer} from 'buffer'
import BN from 'bn.js';
import {AUCTION_ID} from './auction/utils/ids'
import './auction/auction'
import * as auction_api from './auction/auction_api'
// import * as auction_data from './auction/auction_v2'

import * as auction_data from '../common/dist/lib/actions/auction'

const sleep = (ms : number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export class advancedEngine{
	connection : Connection;
	provider : any;
	isConnectedToNetwork : boolean;
	isConnectedToWallet : boolean;
	
	tokenMint : any
	tokenCreator : any;
	resource : any;
	bidders : any;
	auctionCreator : any;
	auctionPubkey : any;
	auctionExtendedPubkey : any;
	programId : PublicKey
	constructor(){
		this.isConnectedToWallet=false
		this.isConnectedToNetwork = (this.connection = new Connection("https://api.devnet.solana.com",'confirmed')) != null
		// this.connectToWallet()
		this.programId=new PublicKey(AUCTION_ID)
		// this.createAuction()
	}
	setupAuction = async (price:number,tick:number,reward:number) =>{
		this.tokenCreator=await Keypair.generate()
		await this.airdrop(this.tokenCreator.publicKey)
		this.auctionCreator=await Keypair.generate()
		await this.airdrop(this.auctionCreator.publicKey)
		this.tokenMint=await splToken.Token.createMint(this.connection,this.tokenCreator,this.tokenCreator.publicKey,null,2,splToken.TOKEN_PROGRAM_ID)
		this.resource=await Keypair.generate().publicKey
		this.auctionPubkey=(await PublicKey.findProgramAddress(
			[
				Buffer.from('auction'),
				this.programId.toBuffer(),
				this.resource.toBuffer()
			],
			this.programId
		))[0]
		this.auctionExtendedPubkey=(await PublicKey.findProgramAddress(
			[
				Buffer.from('auction'),
				this.programId.toBuffer(),
				this.resource.toBuffer(),
				Buffer.from('extended')
			],
			this.programId
		))[0]
		await auction_api.createAuctionV2(
			this.connection,
			this.auctionCreator,
			this.resource,
			this.tokenMint.publicKey,
			1,
			price,
			0,
			tick,
			reward,
		)
		this.bidders=[]
		for(let i=0;i<2;i++){
			let bidder=Keypair.generate()
			await this.airdrop(bidder.publicKey)
			let bidder_token=await this.tokenMint.createAccount(bidder.publicKey)
			let auction_spl_pot=await this.tokenMint.createAccount(this.auctionPubkey)
			await this.tokenMint.mintTo(bidder_token,this.tokenCreator,[],1000)
			this.bidders.push({
				bidder : bidder,
				bidder_token : bidder_token,
				bidder_pot_token : auction_spl_pot
			})
		}
		await auction_api.startAuction(
			this.connection,
			this.auctionCreator,
			this.resource
		)
	}
	createAuction = async(price:number,tick:number,reward:number) =>{
		await this.setupAuction(price, tick, reward)
	}
	airdrop = async(address : PublicKey) =>{
		let hash=await this.connection.requestAirdrop(address,LAMPORTS_PER_SOL)
		await this.connection.confirmTransaction(hash)
		await sleep(10000)
	}
	getTokenAmount = async() : Promise<any> =>{
		let tokenAmountData  : any = []
		for(let i=0;i<2;i++){
			let accountInfo1=await this.tokenMint.getAccountInfo(this.bidders[i].bidder_token)
			let accountInfo2=await this.tokenMint.getAccountInfo(this.bidders[i].bidder_pot_token)
			tokenAmountData.push({own:accountInfo1.amount.words[0],place:accountInfo2.amount.words[0]})
		}
		return tokenAmountData
	}
	getAuctionData = async() : Promise<any> =>{
		let accountInfo=await this.connection.getAccountInfo(this.auctionPubkey)
		if(accountInfo==null) return;
		let auction=auction_data.decodeAuction(accountInfo.data)
		return auction
	}
	getAuctionExtendedData = async() : Promise<any> =>{
		let accountInfo = await this.connection.getAccountInfo(this.auctionExtendedPubkey)
		if(accountInfo==null) return;
		let auctionExtended=auction_data.decodeAuctionDataExtended(accountInfo.data)
		return auctionExtended
	}
	placeBid = async(idx : number, amount : number) => {
		let curBidder=this.bidders[idx]
		let transferAuthority = Keypair.generate()
		await this.tokenMint.approve(
			curBidder.bidder_token,
			transferAuthority.publicKey,
			curBidder.bidder.publicKey,
			[curBidder.bidder],
			amount
		)
		let auction=await this.getAuctionData()
		if(auction.bidState.bids.length == 0)
			await auction_api.placeBid(
				this.connection,
				this.tokenCreator,
				curBidder.bidder,
				curBidder.bidder_token,
				curBidder.bidder_pot_token,
				transferAuthority,
				this.resource,
				this.tokenMint.publicKey,
				amount
			)
		else {
			let prev_bidder=auction.bidState.bids[0]
			await auction_api.placeBidV2(
				this.connection,
				this.tokenCreator,
				curBidder.bidder,
				curBidder.bidder_token,
				curBidder.bidder_pot_token,
				transferAuthority,
				this.resource,
				this.tokenMint.publicKey,
				amount,
				(new PublicKey(prev_bidder.key)),
				(new PublicKey(prev_bidder.bidder_token)),
				(new PublicKey(prev_bidder.bidder_pot_token)),
			)
		}
	}
	cancelBid = async(idx : number)=>{
		let curBidder=this.bidders[idx]
		await auction_api.cancelBid(
			this.connection,
			this.auctionCreator,
			curBidder.bidder,
			curBidder.bidder_token,
			curBidder.bidder_pot_token,
			this.resource,
			this.tokenMint.publicKey
		)
	}
}
