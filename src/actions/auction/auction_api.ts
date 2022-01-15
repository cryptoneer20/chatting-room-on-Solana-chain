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
import BN from 'bn.js';
import * as ax from './auction_v2'
import { pubkeyToString, toPublicKey } from './utils';
import {uint64} from './utils/layout'

const sleep = (ms : number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export async function createAuction(
	conn : Connection,
	authority : Keypair,
	resource : PublicKey,
	mint : PublicKey,
	maxWinners : number,
	priceFloor : number,
	gapTickSizePercentage : number,
	tickSize : number,
	){
	let instruction : TransactionInstruction[] = []
	let setting=new ax.CreateAuctionArgs({
		winners : (new ax.WinnerLimit({type : 1, usize : (new BN(maxWinners)) })),
		endAuctionAt : null,
		auctionGap : null,
		tokenMint : pubkeyToString(mint),
		authority : pubkeyToString(authority.publicKey),
		resource : pubkeyToString(resource),
		priceFloor : (new ax.PriceFloor({type : ax.PriceFloorType.Minimum ,  minPrice : (new BN(priceFloor))})),
		tickSize : (new BN(tickSize)),
		gapTickSizePercentage : gapTickSizePercentage 
	})
	await ax.createAuction(
		setting,
		pubkeyToString(authority.publicKey),
		instruction
	)
	const transaction=new Transaction().add(instruction[0])
	await sendAndConfirmTransaction(conn,transaction,[authority])
}

export async function createAuctionV2(
	conn : Connection,
	authority : Keypair,
	resource : PublicKey,
	mint : PublicKey,
	maxWinners : number,
	priceFloor : number,
	gapTickSizePercentage : number,
	tickSize : number,
	reward_size : number,
	){
	let instruction : TransactionInstruction[] = []
	let setting=new ax.CreateAuctionArgsV2({
		winners : (new ax.WinnerLimit({type : 1, usize : (new BN(maxWinners)) })),
		endAuctionAt : null,
		auctionGap : null,
		tokenMint : pubkeyToString(mint),
		authority : pubkeyToString(authority.publicKey),
		resource : pubkeyToString(resource),
		priceFloor : (new ax.PriceFloor({type : ax.PriceFloorType.Minimum ,  minPrice : (new BN(priceFloor))})),
		tickSize : (new BN(tickSize)),
		gapTickSizePercentage : gapTickSizePercentage,
		reward_size : (new BN(reward_size)),
	})
	await ax.createAuctionV2(
		setting,
		pubkeyToString(authority.publicKey),
		instruction
	)
	const transaction=new Transaction().add(instruction[0])
	await sendAndConfirmTransaction(conn,transaction,[authority])
}

export async function startAuction(
	conn : Connection,
	authority : Keypair,
	resource : PublicKey,
	){
	let instruction : TransactionInstruction[] = []
	await ax.startAuctionWithResource(
		resource.toBase58(),
		authority.publicKey.toBase58(),
		instruction
	)
	const transaction = new Transaction().add(instruction[0])
	await sendAndConfirmTransaction(conn,transaction,[authority])
}

export async function endAuction(
	conn : Connection,
	authority : Connection,
	resource : PublicKey
	){

}

export async function placeBid(
	conn : Connection,
	payer : Keypair,
	bidder : Keypair,
	bidderToken : PublicKey,
	bidderPotToken : PublicKey,
	transferAuthority : Keypair,
	resource : PublicKey,
	mint : PublicKey,
	amount : number
	){
	let instruction : TransactionInstruction[] = []
	await ax.placeBid(
		bidder.publicKey.toBase58(),
		bidderToken.toBase58(),
		bidderPotToken.toBase58(),
		mint.toBase58(),
		transferAuthority.publicKey.toBase58(),
		bidder.publicKey.toBase58(),
		resource.toBase58(),
		(new BN(amount)),
		instruction,
	)
	const transaction=new Transaction().add(instruction[0])
	await sendAndConfirmTransaction(conn,transaction,[bidder,transferAuthority])
}

export async function placeBidV2(
	conn : Connection,
	payer : Keypair,
	bidder : Keypair,
	bidderToken : PublicKey,
	bidderPotToken : PublicKey,
	transferAuthority : Keypair,
	resource : PublicKey,
	mint : PublicKey,
	amount : number,
	prev_bidder : PublicKey,
	prev_bidder_token : PublicKey,
	prev_bidder_pot_token : PublicKey,
	){
	let instruction : TransactionInstruction[] = []
	await ax.placeBidV2(
		bidder.publicKey.toBase58(),
		bidderToken.toBase58(),
		bidderPotToken.toBase58(),
		mint.toBase58(),
		transferAuthority.publicKey.toBase58(),
		bidder.publicKey.toBase58(),
		resource.toBase58(),
		(new BN(amount)),
		prev_bidder.toBase58(),
		prev_bidder_token.toBase58(),
		prev_bidder_pot_token.toBase58(),
		instruction,
	)
	const transaction=new Transaction().add(instruction[0])
	await sendAndConfirmTransaction(conn,transaction,[bidder,transferAuthority])
}

export async function cancelBid(
	conn : Connection,
	payer : Keypair,
	bidder : Keypair,
	bidderToken : PublicKey,
	bidderPotToken : PublicKey,
	resource : PublicKey,
	mint : PublicKey
	){
	let instruction : TransactionInstruction[] = []
	await ax.cancelBid(
		bidder.publicKey.toBase58(),
		bidderToken.toBase58(),
		bidderPotToken.toBase58(),
		mint.toBase58(),
		resource.toBase58(),
		instruction,
	)
	const transaction=new Transaction().add(instruction[0])
	await sendAndConfirmTransaction(conn,transaction,[bidder])
}