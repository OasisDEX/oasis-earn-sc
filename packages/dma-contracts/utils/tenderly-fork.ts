
import fetch from 'node-fetch'

const chainIds = {
    mainnet: 1,
    optimism: 10,
    arbitrum: 42161,
};

export async function createFork(network: string, blockNumber: number = 19000000) {
    let chainId = '1';

    if (!process.env.TENDERLY_ACCESS_TOKEN) {
        return false;
    }

    if (network) {
        chainId = chainIds[network];
    }

    const url = `https://api.tenderly.co/api/v1/account/${process.env.TENDERLY_USERNAME}/project/${process.env.TENDERLY_PROJECT}/fork`;

    const headers: { [key: string]: string } = {
        'Content-Type': 'application/json',
        'X-Access-Key': process.env.TENDERLY_ACCESS_TOKEN,
    };

    const data = { network_id: chainId, block_number: blockNumber};
    const options = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    };

    try {
        const response: any = await fetch(url, options);
        const responseData = await response.json();
        return responseData.simulation_fork.id;
    } catch (err) {
        console.log(err);
        return false;
    }
};

export async function topUpAccount(forkId: string, account: string) {

    let chainId = '1';

    if (!process.env.TENDERLY_ACCESS_TOKEN) {
        return false;
    }

    const url = `https://api.tenderly.co/api/v1/account/${process.env.TENDERLY_USERNAME}/project/${process.env.TENDERLY_PROJECT}/fork/${forkId}/balance`;

    const headers: { [key: string]: string } = {
        'Content-Type': 'application/json',
        'X-Access-Key': process.env.TENDERLY_ACCESS_TOKEN,
    };

    const data = { accounts: [account], amount: 1000000 };
    
    const options = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    };    

    try {
        const response: any = await fetch(url, options);

        if( response.status !== 204 ) {
            return false;
        }
        
        return true
    } catch (err) {
        console.log(err);
        return false;
    }
}

export async function getTenderlyContracts(networkId: number) {
    const url = `https://api.tenderly.co/api/v1/account/${process.env.TENDERLY_USERNAME}/project/${process.env.TENDERLY_PROJECT}/contracts`

    if (!process.env.TENDERLY_ACCESS_TOKEN) {
        return false;
    }

    const headers: { [key: string]: string } = {
        'Content-Type': 'application/json',
        'X-Access-Key': process.env.TENDERLY_ACCESS_TOKEN,
    };

    const options = {
        method: 'GET',
        headers: headers,
    };    

    try {
        const response: any = await fetch(url, options);

        if(response.data) {
            const contracts = response.data.fiter((contract: any) => contract.contract.network_id === networkId).map((contract: any) => {
                return {
                    address: contract.contract.address,
                    display_name: contract.display_name
                }
            })
            return contracts;
        }
    
        
        return false
    } catch (err) {
        console.log("Error fetching contract from Tenderly: ", err);
        return false;
    }
}

const sendTenderlyContracts = async (contractsToSend: any) => {
    const url = `https://api.tenderly.co/api/v1/account/${process.env.TENDERLY_USERNAME}/project/${process.env.TENDERLY_PROJECT}/contracts`

    if (!process.env.TENDERLY_ACCESS_TOKEN) {
        return false;
    }

    const headers: { [key: string]: string } = {
        'Content-Type': 'application/json',
        'X-Access-Key': process.env.TENDERLY_ACCESS_TOKEN,
    };

    const options = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({contracts: contractsToSend})
    };   

    try {
        const response: any = await fetch(url, options);
         
    } catch (error) {
        console.error('Error sending contracts to Tenderly', error);
    }
};
