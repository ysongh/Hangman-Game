"use client";

import { useEffect, useState } from 'react';
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import CodeSnippet from "~~/components/nillion/CodeSnippet";
import { CopyString } from "~~/components/nillion/CopyString";
import { NillionOnboarding } from "~~/components/nillion/NillionOnboarding";
import RetrieveSecretCommand from "~~/components/nillion/RetrieveSecretCommand";
// import SecretForm from "~~/components/nillion/SecretForm";
import { Address } from "~~/components/scaffold-eth";
import { compute } from "~~/utils/nillion/compute";
import { getUserKeyFromSnap } from "~~/utils/nillion/getUserKeyFromSnap";
import { retrieveSecretCommand } from "~~/utils/nillion/retrieveSecretCommand";
import { retrieveSecretInteger } from "~~/utils/nillion/retrieveSecretInteger";
import { storeProgram } from "~~/utils/nillion/storeProgram";
import { storeSecretsInteger } from "~~/utils/nillion/storeSecretsInteger";
import SecretWordForm from '~~/components/nillion/SecretWordForm';
import GuessForm from '~~/components/nillion/GuessForm';

const words = ['apple', 'banana', 'orange', 'grape', 'pineapple'];

const HangmanGame: NextPage = () => {
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [remainingAttempts, setRemainingAttempts] = useState(6);

  const { address: connectedAddress } = useAccount();
  const [connectedToSnap, setConnectedToSnap] = useState<boolean>(false);
  const [userKey, setUserKey] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [nillion, setNillion] = useState<any>(null);
  const [nillionClient, setNillionClient] = useState<any>(null);

  const [programName] = useState<string>("hangman");
  const [programId, setProgramId] = useState<string | null>(null);
  const [computeResult, setComputeResult] = useState<string | null>(null);

  const [storedSecretsNameToStoreId, setStoredSecretsNameToStoreId] = useState<StringObject>({
    letter1: null,
    letter2: null,
    guess: null,
  });
  const [parties] = useState<string[]>(["Party1"]);
  const [outputs] = useState<string[]>(["my_output"]);

  // connect to snap
  async function handleConnectToSnap() {
    const snapResponse = await getUserKeyFromSnap();
    setUserKey(snapResponse?.user_key || null);
    setConnectedToSnap(snapResponse?.connectedToSnap || false);
  }

  // store program in the Nillion network and set the resulting program id
  async function handleStoreProgram() {
    await storeProgram(nillionClient, programName).then(setProgramId);
  }

  async function handleRetrieveInt(secret_name: string, store_id: string | null) {
    if (store_id) {
      const value = await retrieveSecretInteger(nillionClient, store_id, secret_name);
      alert(`${secret_name} is ${value}`);
    }
  }

  // reset nillion values
  const resetNillion = () => {
    setConnectedToSnap(false);
    setUserKey(null);
    setUserId(null);
    setNillion(null);
    setNillionClient(null);
  };

  useEffect(() => {
    // when wallet is disconnected, reset nillion
    if (!connectedAddress) {
      resetNillion();
    }
  }, [connectedAddress]);

  // Initialize nillionClient for use on page
  useEffect(() => {
    if (userKey) {
      const getNillionClientLibrary = async () => {
        const nillionClientUtil = await import("~~/utils/nillion/nillionClient");
        const libraries = await nillionClientUtil.getNillionClient(userKey);
        setNillion(libraries.nillion);
        setNillionClient(libraries.nillionClient);
        return libraries.nillionClient;
      };
      getNillionClientLibrary().then(nillionClient => {
        const user_id = nillionClient.user_id;
        setUserId(user_id);
      });
    }
  }, [userKey]);

  // handle form submit to store secrets with bindings
  async function handleSecretFormSubmit(
    secretName: string,
    secretValue: string,
    permissionedUserIdForRetrieveSecret: string | null,
    permissionedUserIdForUpdateSecret: string | null,
    permissionedUserIdForDeleteSecret: string | null,
    permissionedUserIdForComputeSecret: string | null,
  ) {
    if (programId) {
      const partyName = parties[0];
      await storeSecretsInteger(
        nillion,
        nillionClient,
        [{ name: secretName, value: secretValue }],
        programId,
        partyName,
        permissionedUserIdForRetrieveSecret ? [permissionedUserIdForRetrieveSecret] : [],
        permissionedUserIdForUpdateSecret ? [permissionedUserIdForUpdateSecret] : [],
        permissionedUserIdForDeleteSecret ? [permissionedUserIdForDeleteSecret] : [],
        permissionedUserIdForComputeSecret ? [permissionedUserIdForComputeSecret] : [],
      ).then(async (store_id: string) => {
        console.log("Secret stored at store_id:", store_id);
        setStoredSecretsNameToStoreId(prevSecrets => ({
          ...prevSecrets,
          [secretName]: store_id,
        }));
      });
    }
  }

  // compute on secrets
  async function handleCompute() {
    if (programId) {
      await compute(nillion, nillionClient, Object.values(storedSecretsNameToStoreId), programId, outputs[0]).then(
        result => setComputeResult(result),
      );
    }
  }

  const getRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
  };

  const handleNewGame = () => {
    const newWord = getRandomWord();
    setWord(newWord);
    setGuessedLetters(new Set());
    setRemainingAttempts(6);
  };

  const handleGuess = (letter) => {
    if (!guessedLetters.has(letter)) {
      const newGuessedLetters = new Set(guessedLetters);
      newGuessedLetters.add(letter);
      setGuessedLetters(newGuessedLetters);

      if (!word.includes(letter)) {
        setRemainingAttempts(remainingAttempts - 1);
      }
    }
  };

  const getDisplayWord = () => {
    return word
      .split('')
      .map((letter) => (guessedLetters.has(letter) ? letter : '_'))
      .join(' ');
  };

  const isGameWon = () => {
    return word.split('').every((letter) => guessedLetters.has(letter));
  };

  const isGameOver = () => {
    return remainingAttempts === 0 || isGameWon();
  };

  return (
    <div className="flex flex-col items-center mt-8">
      <h1 className="text-xl">
        <span className="block text-4xl font-bold">Hangman Game</span>
        {!connectedAddress && <p>Connect your MetaMask Flask wallet</p>}
        {connectedAddress && connectedToSnap && !userKey && (
          <a target="_blank" href="https://nillion-snap-site.vercel.app/" rel="noopener noreferrer">
            <button className="btn btn-sm btn-primary mt-4">
              No Nillion User Key - Generate and store user key here
            </button>
          </a>
        )}
      </h1>

      {connectedAddress && (
        <div className="flex justify-center items-center space-x-2">
          <p className="my-2 font-medium">Connected Wallet Address:</p>
          <Address address={connectedAddress} />
        </div>
      )}

      {connectedAddress && !connectedToSnap && (
        <button className="btn btn-sm btn-primary mt-4" onClick={handleConnectToSnap}>
          Connect to Snap with your Nillion User Key
        </button>
      )}

      {connectedToSnap && (
        <div>
          {userKey && (
            <div>
              <div className="flex justify-center items-center space-x-2">
                <p className="my-2 font-medium">
                  🤫 Nillion User Key from{" "}
                  <a target="_blank" href="https://nillion-snap-site.vercel.app/" rel="noopener noreferrer">
                    MetaMask Flask
                  </a>
                  :
                </p>

                <CopyString str={userKey} />
              </div>

              {userId && (
                <div className="flex justify-center items-center space-x-2">
                  <p className="my-2 font-medium">Connected as Nillion User ID:</p>
                  <CopyString str={userId} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
        <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
          {!connectedToSnap ? (
            <NillionOnboarding />
          ) : (
            <div>
              <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-m rounded-3xl my-2">
                <h1 className="text-xl">Step 1: Store a Nada program</h1>
                {!programId ? (
                  <button className="btn btn-sm btn-primary mt-4" onClick={handleStoreProgram}>
                    Store {programName} program
                  </button>
                ) : (
                  <div>
                    ✅ {programName} program stored <br />
                    <span className="flex">
                      <CopyString str={programId} start={5} end={programName.length + 5} textBefore="program_id: " />
                    </span>
                  </div>
                )}

                <CodeSnippet program_name={programName} />
              </div>

              <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center w-full rounded-3xl my-2 justify-between">
                <h1 className="text-xl">
                  Step 2: Store secret integers with program bindings to the {programName} program
                </h1>

                <div className="flex flex-row w-full justify-between items-center my-10 mx-10">
                  <div className="flex-1 px-2">
                    {!!storedSecretsNameToStoreId.letter1 && userKey ? (
                      <>
                        <RetrieveSecretCommand
                          secretType="SecretInteger"
                          userKey={userKey}
                          storeId={storedSecretsNameToStoreId.letter1}
                          secretName="letter1"
                        />
                        <button
                          className="btn btn-sm btn-primary mt-4"
                          onClick={() => handleRetrieveInt("letter1", storedSecretsNameToStoreId[key])}
                        >
                          👀 Retrieve SecretInteger
                        </button>
                      </>
                    ) : (
                      <SecretWordForm
                        secretName="letter1"
                        onSubmit={handleSecretFormSubmit}
                        isDisabled={!programId}
                        secretType="number"
                      />
                    )}
                  </div>

                  <div className="flex-1 px-2">
                    {!!storedSecretsNameToStoreId.letter2 && userKey ? (
                      <>
                        <RetrieveSecretCommand
                          secretType="SecretInteger"
                          userKey={userKey}
                          storeId={storedSecretsNameToStoreId.letter2}
                          secretName="letter2"
                        />
                        <button
                          className="btn btn-sm btn-primary mt-4"
                          onClick={() => handleRetrieveInt("letter2", storedSecretsNameToStoreId[key])}
                        >
                          👀 Retrieve SecretInteger
                        </button>
                      </>
                    ) : (
                      <SecretWordForm
                        secretName="letter2"
                        onSubmit={handleSecretFormSubmit}
                        isDisabled={!programId}
                        secretType="number"
                      />
                    )}
                  </div>
                </div>
               
                <GuessForm
                  secretName="guess"
                  onSubmit={handleSecretFormSubmit}
                  isDisabled={!programId}
                  secretType="number"
                />
              </div>

              <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center w-full rounded-3xl my-2 justify-between">
                <h1 className="text-xl">
                  Step 3: Perform blind computation with stored secrets in the {programName} program
                </h1>
                <button
                  className="btn btn-sm btn-primary mt-4"
                  onClick={handleCompute}
                  disabled={Object.values(storedSecretsNameToStoreId).every(v => !v)}
                >
                  Compute on {programName}
                </button>
                {computeResult && <p>✅ Compute result: {computeResult}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
      

      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleNewGame}>
        New Game
      </button>
      <div className="mt-8">
        {isGameOver() && (
          <div>
            <h2 className="text-2xl font-semibold mb-2">{isGameWon() ? 'You Win!' : 'Game Over!'}</h2>
            <p>The word was: {word}</p>
          </div>
        )}
        {!isGameOver() && (
          <div>
            <div className="mb-4">{getDisplayWord()}</div>
            <div className="flex flex-wrap">
              {Array.from(Array(26).keys()).map((i) => (
                <button
                  key={i}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded mr-2 mb-2"
                  onClick={() => handleGuess(String.fromCharCode(65 + i).toLowerCase())}
                  disabled={isGameOver()}
                >
                  {String.fromCharCode(65 + i)}
                </button>
              ))}
            </div>
            <p className="mt-4">Remaining Attempts: {remainingAttempts}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HangmanGame;
