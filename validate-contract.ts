import axios from 'axios'

const apikey = 'your etherscan api key';

enum Standard {
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  UNKNOWN = 'unknown'
}

// 721
function checkTransferEvent(abi: any[]): boolean {
  let item = abi.find(item => item.name === 'Transfer' && item.type === 'event');
  if (!item) return false;

  const expect = [
    { indexed: true, type: 'address' },
    { indexed: true, type: 'address' },
    { indexed: true, type: 'uint256' },
  ];
  if (item.inputs.length !== expect.length) return false;
  for (let i = 0; i < expect.length; i++) {
    if (item.inputs[i].indexed !== expect[i].indexed || item.inputs[i].type !== expect[i].type) return false;
  }
  return true;
}

// 721
function checkTokenURI(abi: any[]) {
  let item = abi.find(item => item.name === 'tokenURI' && item.type === 'function');
  if (!item) return false;

  if (item.inputs.length !== 1) return false;
  if (item.inputs[0].type !== 'uint256') return false;
  if (item.outputs.length !== 1) return false;
  if (item.outputs[0].type !== 'string') return false;

  return true;
}

// 1155
function checkTransferSingleEvent(abi: any[]): boolean {
  let item = abi.find(item => item.name === 'TransferSingle' && item.type === 'event');
  if (!item) return false;

  const expect = [
    { indexed: true, type: 'address' },
    { indexed: true, type: 'address' },
    { indexed: true, type: 'address' },
    { indexed: false, type: 'uint256' },
    { indexed: false, type: 'uint256' },
  ];
  if (item.inputs.length !== expect.length) return false;
  for (let i = 0; i < expect.length; i++) {
    if (item.inputs[i].indexed !== expect[i].indexed || item.inputs[i].type !== expect[i].type) return false;
  }
  return true;
}

// 1155
function checkTransferBatchEvent(abi: any[]): boolean {
  let item = abi.find(item => item.name === 'TransferBatch' && item.type === 'event');
  if (!item) return false;

  const expect = [
    { indexed: true, type: 'address' },
    { indexed: true, type: 'address' },
    { indexed: true, type: 'address' },
    { indexed: false, type: 'uint256[]' },
    { indexed: false, type: 'uint256[]' },
  ];
  if (item.inputs.length !== expect.length) return false;
  for (let i = 0; i < expect.length; i++) {
    if (item.inputs[i].indexed !== expect[i].indexed || item.inputs[i].type !== expect[i].type) return false;
  }
  return true;
}

// 1155
function checkURI(abi: any[]): boolean {
  let item = abi.find(item => item.name === 'uri' && item.type === 'function');
  if (!item) return false;

  if (item.inputs.length !== 1) return false;
  if (item.inputs[0].type !== 'uint256') return false;
  if (item.outputs.length !== 1) return false;
  if (item.outputs[0].type !== 'string') return false;
  return true;
}

function check721(abi: any[]) {
  const Transfer = checkTransferEvent(abi);
  const tokenURI = checkTokenURI(abi);

  const pass = Transfer && tokenURI;

  return {
    pass,
    points: {
      Transfer,
      tokenURI,
    },
  };
}

function check1155(abi: any[]) {
  const TransferSingle = checkTransferSingleEvent(abi);
  const TransferBatch = checkTransferBatchEvent(abi);
  const uri = checkURI(abi);

  const pass = TransferSingle && TransferBatch && uri;

  return {
    pass,
    points: {
      TransferSingle,
      TransferBatch,
      uri,
    },
  };
}

async function validateContract(contract: string) {
  const url = `http://api.etherscan.io/api?module=contract&action=getabi&address=${contract}&apikey=${apikey}`;
  const res = await axios.get(url);
  const abi = JSON.parse(res.data.result);

  const erc721 = check721(abi);
  const erc1155 = check1155(abi);
  return {
    erc721,
    erc1155,
  };
}

async function run(contracts: string[]) {


  for (const contract of contracts) {
    const res = await validateContract(contract);

    let standard: string;
    if (res.erc721.pass) {
      standard = Standard.ERC721;
    } else if (res.erc1155.pass) {
      standard = Standard.ERC1155;
    } else {
      standard = Standard.UNKNOWN;
    }

    console.log(`contract: ${contract} standard: ${standard}`);
  }
}

const contracts = [
  '0x959e104e1a4db6317fa58f8295f586e1a978c297',
  '0xc1f4b0eea2bd6690930e6c66efd3e197d620b9c2',
  '0xc3af02c0fd486c8e9da5788b915d6fff3f049866',
  '0xf64dc33a192e056bb5f0e5049356a0498b502d50',
  '0x32b7495895264ac9d0b12d32afd435453458b1c6',
  '0xd35147be6401dcb20811f2104c33de8e97ed6818',
  '0x3163d2cfee3183f9874e2869942cc62649eeb004',
  '0x201c3af8c471e5842428b74d1e7c0249adda2a92',
  '0x6a99abebb48819d2abe92c5e4dc4f48dc09a3ee8',
  '0x1e1d4e6262787c8a8783a37fee698bd42aa42bec',
  '0xbf53c33235cbfc22cef5a61a83484b86342679c5',
  '0x75a3752579dc2d63ca229eebbe3537fbabf85a12',
  '0x574f64ac2e7215cba9752b85fc73030f35166bc0',
  '0x34ed0aa248f60f54dd32fbc9883d6137a491f4f3',
];
run(contracts);
