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
const BufferLayout = require('buffer-layout')

const MESSAGE_SEED="John Mickle10"
const programId=new PublicKey('Bi52YWSUJn88yVknRM2Pvop4Pax7cuAYNq7Pg5Qxgw3g')
var messagePubkey = new PublicKey('5g7wiQai2dWRwEjgQiUR8wy1y8vKWN4QJAMy7nA9HBgA')

// var messagePubkey : PublicKey;
//import * as borsh from 'borsh'
// class MessagesAccount{
// 	counter=0;
// 	constructor(fields:{counter:number} | undefined=undefined){
// 		if(fields){
// 			this.counter=fields.counter;
// 		}
// 	}
// }
// const MessagesSchema=new Map([
// 	[MessagesAccount,{kind:'struct',fields:[['counter','u32']]}]
// ])
// const MESSAGE_SIZE = borsh.serialize(MessagesSchema,new MessagesAccount()).length;
// var MessageData={
// 	counter : Number
// }
// const dataLayout=BufferLayout.struct([
// 	BufferLayout.u32("counter")
// ]);

const publicKey=(property:string="publicKey"):Object=>{
	return BufferLayout.blob(32,property);
}

const dataLayout=BufferLayout.struct([
	BufferLayout.blob(32,'address'),
	BufferLayout.seq(BufferLayout.u8(),100,'message')
	//BufferLayout.blob(100,'message')
]);


const MESSAGE_SIZE=dataLayout.span;

export class messageEngine{
	connection : Connection ;
	provider : any;
	network : string;
	isConnected : boolean;
	constructor(){
		//this.network="https://api.testnet.solana.com"
		this.network="https://api.testnet.solana.com"
		this.connection=new Connection(this.network,'confirmed')
		this.isConnected = false
		//this.connectWalletPhantom()
	}

	async connectWalletPhantom(){
		if(this.isConnected) return;
		if((window as any)?.solana?.isPhantom){
			this.provider=(window as any).solana;
			this.provider.on('connect',()=>{
				this.isConnected=true;
			})
			this.provider.on('disconnect',()=>{
				this.isConnected=false;
			})
			console.log(this.provider)
			await this.provider.connect();
			// messagePubkey=await PublicKey.createWithSeed(this.provider.publicKey,MESSAGE_SEED,programId)
			// if(messagePubkey == null) this.isConnected=false;
			// console.log(messagePubkey.toBase58())
		}
		// else{
		// 	window.open("https://phantom.app/","_blank");
		// }
	}

	async connectWalletSollet(){
		if(this.isConnected) return;
		//let wallet='https://www.sollet.io';
		let wallet=(window as any).sollet;
		this.provider=new Wallet(wallet,"https://www.sollet.io");
		this.provider.on('connect',()=>{
			this.isConnected=true;
		})
		this.provider.on('disconnect',()=>{
			this.isConnected=false;
		})
		
		await this.provider.connect();
	}

	async disconnectWallet(){
		await this.provider.disconnect();
	}

	async getLamports(){
		if(this.isConnected===false){
			alert("You first connect your wallet")
			return;
		}
		console.log(this.provider.publicKey);
		const hash = await this.connection.requestAirdrop(this.provider.publicKey,LAMPORTS_PER_SOL)
		await this.connection.confirmTransaction(hash)
		await this.getBalance(this.provider.publicKey)
	}

	async getBalance(address : PublicKey){
		const balance=await this.connection.getBalance(address);
		console.log(balance);
	}

	async buildMessageAccount(){
		const lamports=await this.connection.getMinimumBalanceForRentExemption(MESSAGE_SIZE);
		const transaction=new Transaction().add(
			SystemProgram.createAccountWithSeed({
				fromPubkey:this.provider.publicKey,
				basePubkey:this.provider.publicKey,
				seed:MESSAGE_SEED,
				newAccountPubkey:messagePubkey,
				lamports,
				space:MESSAGE_SIZE,
				programId,
			})
		)
		await this.sendTransaction(transaction);
	}

	async getMessageInfo() : Promise<any> {
		if(this.isConnected === false){
			alert("You first connect your wallet")
			return;
		}
		const accountInfo = await this.connection.getAccountInfo(messagePubkey);
		if(accountInfo === null) return;
		var a=dataLayout.decode(accountInfo.data);
		var p=new PublicKey(a.address);
		var m=Buffer.from(a.message)
		var e=0;
		for(var i=m.length-1;i>=0;i--)
			if(m[i]!==0){
				e=i; break;
			}
		return {from:p.toBase58(),content:m.slice(4,e+1).toString('utf8')};
	}

	async setMessageInfo(sendData : string) : Promise<boolean>{
		if(this.isConnected === false){
			alert("You first connect your wallet")
			return false;
		}
		if((await this.connection.getAccountInfo(messagePubkey))==null  || this.provider==null){
			this.buildMessageAccount()
			return false;
		}
		const _data ={
			address:this.provider.publicKey.toBuffer(),
			message:Buffer.from(sendData)
		};
		let data=Buffer.alloc(MESSAGE_SIZE)
		dataLayout.encode(_data,data);
		const instruction = new TransactionInstruction({
			keys:[
				{pubkey:messagePubkey,isSigner:false,isWritable:true}
			],
			programId,
			data
		})
		const transaction=new Transaction().add(instruction)
		await this.sendTransaction(transaction)

		
		//await this.getMessageInfo();
		return true;
	}

	async sendTransaction(transaction : Transaction){
		transaction.setSigners(this.provider.publicKey);
		transaction.recentBlockhash=(await this.connection.getRecentBlockhash('max')).blockhash;
		const signedTransaction=await this.provider.signTransaction(transaction);
		await this.connection.sendRawTransaction(signedTransaction.serialize());
	}
}


export class tokenEngine{
	connection : Connection;
	provider : any;
	isConnectedToNetwork : boolean;
	isConnectedToWallet : boolean;

	constructor(){
		this.isConnectedToWallet=false
		this.isConnectedToNetwork = (this.connection = new Connection("http://localhost:8899",'confirmed')) != null
		//this.connectToWallet()
		//this.connectToSollet()
	}
	connectToNetwork = async () =>{
		this.isConnectedToNetwork = (this.connection = new Connection("http://localhost:8899",'confirmed')) != null
	}
	connectToWallet = async () =>{ //connect Phantom
		if(this.isConnectedToWallet) return
		if("solana" in (window as any)){
			this.provider=(window as any).solana
			this.isConnectedToWallet=true;
			this.provider.on("connect",()=>this.isConnectedToWallet=true)
			this.provider.on("disconnect",()=>this.isConnectedToWallet=false)
			await this.provider.connect()
		}else{
			this.isConnectedToWallet=false
		}
	}
	connectToSollet = async () =>{
		if(this.isConnectedToWallet) return
		if("sollet" in (window as any)){
			let sollet=(window as any).sollet;
			this.provider=new Wallet(sollet,"http://localhost::8899");
			this.provider.on("connect",()=>this.isConnectedToWallet=true)
			this.provider.on("disconnect",()=>this.isConnectedToWallet=false)
			await this.provider.connect()
		}else{
			this.isConnectedToWallet=false
		}
	}

	getBalance = async () =>{
		if(this.isConnectedToWallet && this.isConnectedToNetwork)
			console.log(Math.round(await this.connection.getBalance(this.provider.publicKey)/Math.pow(10,7))/100 +" sol.")
		else
			console.log("Error!")
	}

	getLamports = async (address : PublicKey = this.provider.publicKey) =>{
		if(this.isConnectedToWallet && this.isConnectedToNetwork && address!=null){
			let hash=await this.connection.requestAirdrop(address,LAMPORTS_PER_SOL)
			await this.connection.confirmTransaction(hash)	
		}
		await this.getBalance()
	}
	createToken = async () =>{
		var fromWallet = Keypair.generate()
		await this.getLamports(fromWallet.publicKey)
		let mint = await splToken.Token.createMint(this.connection,fromWallet,fromWallet.publicKey,null,6,splToken.TOKEN_PROGRAM_ID)
		let fromTokenAccount = await mint.getOrCreateAssociatedAccountInfo(fromWallet.publicKey)
		let toTokenAccount = await mint.getOrCreateAssociatedAccountInfo(this.provider.publicKey)
		await mint.mintTo(
			fromTokenAccount.address,
			fromWallet.publicKey,
			[],
			1000000
		)
		var transaction =new Transaction().add(
			splToken.Token.createTransferInstruction(
				splToken.TOKEN_PROGRAM_ID,
				fromTokenAccount.address,
				toTokenAccount.address,
				fromWallet.publicKey,
				[],
				1000000,
			)
		)
		var hash=sendAndConfirmTransaction(
			this.connection,
			transaction,
			[fromWallet],
			{commitment:'confirmed'}
		)
		
		// let mint = await splToken.Token.createMint(this.connection,this.provider,this.provider.publicKey,null,6,splToken.TOKEN_PROGRAM_ID)
		// let fromTokenAccount = await mint.getOrCreateAssociatedAccountInfo(this.provider.publicKey)
		// await mint.mintTo(fromTokenAccount.address,this.provider.publicKey,[],1000)
		// this.sendTransaction(transaction);
	}

	transferToken = async (address : PublicKey) =>{

	}

	sendTransaction = async (transaction : Transaction) =>{
		transaction.feePayer = await this.provider.publicKey
		transaction.recentBlockhash=(await this.connection.getRecentBlockhash()).blockhash
		let signedTransaction=await this.provider.signTransaction(transaction)
		let hash=await this.connection.sendRawTransaction(signedTransaction)
		await this.connection.confirmTransaction(hash)
	}
}

export class testEngine{
	connection : Connection;
	network : string;
	payer : Keypair;
	constructor(){
		this.network="http://localhost:8899"
		this.connection=new Connection(this.network,'confirmed')
		this.payer=Keypair.generate();
	}
	async getLamports(){
		const hash=await this.connection.requestAirdrop(this.payer.publicKey,LAMPORTS_PER_SOL)
		await this.connection.confirmTransaction(hash)
		await this.getBalance(this.payer.publicKey);
	}
	async getBalance(address : PublicKey){
		console.log(await this.connection.getBalance(address))
	}
	async getMessageInfo() : Promise<any>{
		const accountInfo = await this.connection.getAccountInfo(messagePubkey)
		if(accountInfo === null) return;
		var a=dataLayout.decode(accountInfo.data);
		var p=new PublicKey(a.address);
		var m=Buffer.from(a.message)
		var e=4
		for(var i=m.length-1;i>=0;i--)
			if(m[i]!==0){
				e=i; break;
			}
		return {from:p.toBase58(),content:m.slice(4,e+1).toString('utf8')};
	}
	async setMessageInfo(){
		const instruction = new TransactionInstruction({
			keys:[
				{pubkey:messagePubkey,isSigner:false,isWritable:true},
				{pubkey:this.payer.publicKey,isSigner:false,isWritable:false}
			],
			programId,
			data:Buffer.alloc(0)
		})
		const transaction=new Transaction().add(instruction)
		await this.sendTransaction(transaction)
		//await this.getMessageInfo();
	}
	async sendTransaction(transaction : Transaction){
		await sendAndConfirmTransaction(this.connection,transaction,[this.payer]);
	}
	connectWallet(){

	}
}