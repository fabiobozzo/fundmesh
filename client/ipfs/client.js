import { create } from 'ipfs-http-client';

const basicAuth = process.env.NEXT_PUBLIC_INFURA_IPFS_AUTH;
const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: 'Basic ' + basicAuth
  }
});

const uploadFiles = async (files) => {
  // Upload the files to IPFS
  const result = [];
  for await (const file of client.addAll(files, { wrapWithDirectory: true })) {
    result.push(file);
  }

  // The CID of the directory is the last item in the result array
  return result[result.length - 1].cid.toString();;
};

const uploadFile = async (file) => {
  const addedFile = await client.add(file);
  return addedFile.cid.toString();
};

export {
  uploadFiles,
  uploadFile
};