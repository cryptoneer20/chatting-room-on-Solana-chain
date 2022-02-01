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
import {getPayer, getRpcUrl, createKeypairFromFile} from './utils';
import * as borsh from 'borsh'

let connection : Connection;
let provider : any;
const GREETING_SEED='John Mickle';
// const programId=new PublicKey('Fp2d9aped136FrH7T7B7LkA2fqnzj9JMJB8sT6SF8pYv');
const programId=new PublicKey('Bi52YWSUJn88yVknRM2Pvop4Pax7cuAYNq7Pg5Qxgw3g');
class GreetingAccount{
	counter=0;
	constructor(fields:{counter:number} | undefined=undefined){
		if(fields){
			this.counter=fields.counter;
		}
	}
}

const GreetingSchema=new Map([
	[GreetingAccount,{kind:'struct',fields:[['counter','u32']]}],
])

const GREETING_SIZE = borsh.serialize(
  GreetingSchema,
  new GreetingAccount(),
).length;

export async function connectNetwork(){
	//const url=await getRpcUrl();
	connection=new Connection("https://api.testnet.solana.com",'confirmed')
}

export async function connectWallet(){
	if((window as any)?.solana?.isPhantom){
		provider=(window as any).solana;
		await provider.connect();
	}
	else 
		window.open("https://phantom.app/",'_blank');
}

export async function fund(){
	await connectWallet();
	await connectNetwork();
	const hash = await connection.requestAirdrop(provider.publicKey,LAMPORTS_PER_SOL)
	await connection.confirmTransaction(hash);
	await getBalance(provider.publicKey.toBase58())
}

export async function buildGreeterAccount(){
	await connectWallet();
	await connectNetwork();
	const greetedPubkey=await PublicKey.createWithSeed(
		provider.publicKey,GREETING_SEED,programId,
	)
	const lamports=await connection.getMinimumBalanceForRentExemption(GREETING_SIZE);
	const transaction=new Transaction().add(
		SystemProgram.createAccountWithSeed({
			fromPubkey:provider.publicKey,
			basePubkey:provider.publicKey,
			seed:GREETING_SEED,
			newAccountPubkey:greetedPubkey,
			lamports,
			space:GREETING_SIZE,
			programId,
		})
	);
	transaction.recentBlockhash=(await connection.getRecentBlockhash('max')).blockhash;
	transaction.setSigners(provider.publicKey)
	const signedTransaction=await provider.signTransaction(transaction);
	const hash=await connection.sendRawTransaction(signedTransaction.serialize());
}

export async function getGreeterInfo(){
	await connectWallet()
	await connectNetwork()
	const greetedPubkey=await PublicKey.createWithSeed(
		provider.publicKey,GREETING_SEED,programId,
	)
	const accountInfo = await connection.getAccountInfo(greetedPubkey);
	if(accountInfo === null) return;
	const greeting = borsh.deserialize(GreetingSchema,GreetingAccount,accountInfo.data);
	console.log(greeting.counter);
}

export async function setGreeterInfo(){
	await connectWallet()
	await connectNetwork()
	const greetedPubkey=await PublicKey.createWithSeed(
		provider.publicKey,GREETING_SEED,programId,
	)

	if((await connection.getAccountInfo(greetedPubkey)) == null){
		buildGreeterAccount()
	}

	const instruction = new TransactionInstruction({
		keys:[{pubkey:greetedPubkey,isSigner:false,isWritable:true}],
		programId,
		data:Buffer.alloc(0)
	})
	const transaction=new Transaction().add(instruction)
	transaction.recentBlockhash=(await connection.getRecentBlockhash('max')).blockhash;
	transaction.setSigners(provider.publicKey)
	const signedTransaction=await provider.signTransaction(transaction);
	const hash=await connection.sendRawTransaction(signedTransaction.serialize());
}

export async function transferSol(to:string,sol:number){
	await connectNetwork()
	await connectWallet()
	const toPubkey=new PublicKey(to);
	const lamports=LAMPORTS_PER_SOL*sol
	const transaction=new Transaction().add(
		SystemProgram.transfer({
			fromPubkey:provider.publicKey,toPubkey,lamports
		})
	)
	transaction.recentBlockhash=(await connection.getRecentBlockhash('max')).blockhash;
	transaction.setSigners(provider.publicKey)
	const signedTransaction=await provider.signTransaction(transaction)
	const hash = await connection.sendRawTransaction(signedTransaction.serialize())
	getBalance(provider.publicKey.toBase58())
	getBalance(to)
}

export async function getBalance(address:string){
	await connectNetwork();
	const publicKey=new PublicKey(address);
	const balance = await connection.getBalance(publicKey);
	console.log(balance);
}