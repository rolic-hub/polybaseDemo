import { CollectionRecordResponse, Polybase } from "@polybase/client";
import { Auth } from "@polybase/auth";
import React, { useState, useEffect } from "react";
import { ethPersonalSignRecoverPublicKey } from "@polybase/eth";
import "./styles.css";
import { ethers } from "ethers";
import { useCollection } from "@polybase/react";

const auth = new Auth();

const db = new Polybase({
  defaultNamespace:
    "pk/0xeaff3acda3168f34b902292254edec6ef11cd57e7626fd9215ef88af76f1422fcd87f1977522d8518a7d5fe75981982f20f48eee8604a12d5806752bcb4e1780/Chat_app_2",
});

async function getPublicKey() {
  const msg = "Login with Chat";
  const sig = await auth.ethPersonalSign(msg);
  const publicKey = ethPersonalSignRecoverPublicKey(sig, msg);
  return "0x" + publicKey.slice(4);
}

const ChatPage = () => {
  const [addAUser, setAddUser] = useState<string>("");
  const [messageText, setMessageText] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [ispublicKey, setIspublickey] = useState<any>("");
  const [members, setMembers] = useState<CollectionRecordResponse<any>[]>([]);
  const [messages, setMessages] = useState<CollectionRecordResponse<any>[]>([]);
  const [groupbar, setGroupbar] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>("");
  const [groupDesc, setGroupDesc] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<any>();
  const [getdata, setData] = useState<any>();
  const [showChat, setShowChat] = useState<boolean>(false);
  const [Mid, setId] = useState<string>("");

  const query = db.collection("Group");
  const { data: groupdata, error, loading } = useCollection(query);
  console.log(groupdata);
  const groupData = groupdata?.data;

  const createGroup = async (name: string, desc: string) => {
    const id = ethers.id(name);
    try {
      const newGroup = await db
        .collection("Group")
        .create([id, name, desc, db.collection("User").record(ispublicKey)]);
      console.log(newGroup.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getMembersAndChat = async (members: [], messages: [], data: any) => {
    setData(data);
    console.log(data);
    setShowChat(true);
    let memberId: CollectionRecordResponse<any>[] = [];
    members.forEach(async (member) => {
      const user = await db.collection("User").record(member.id).get();
      memberId.push(user);
    });
    console.log(memberId);
    setMembers(memberId);

    let messagesArray: CollectionRecordResponse<any>[] = [];
    messages.forEach(async (mes) => {
      const getMessage = await db.collection("Message").record(mes.id).get();
      messagesArray.push(getMessage);
    });
    console.log(messagesArray);
    setMessages(messagesArray);
  };

  const addUser = async () => {
    try {
      const isUser = await db
        .collection("User")
        .where("address", "==", addAUser.toLowerCase())
        .get();
      console.log(isUser);
      const userId = isUser.data[0].data.id;
      const id = getdata?.id;
      const addAuser = await db
        .collection("Group")
        .record(id)
        .call("addMember", [db.collection("User").record(userId)]);
      console.log(addAuser);
    } catch (error) {
      console.log(error);
    }
  };
  const sendMessage = async (message: string) => {
    try {
      const timestamp = Date.now().toString(); //new Date().toDateString()
      const id = ethers.id(message + walletAddress + timestamp);
      console.log(id);

      const CreaMess = await db
        .collection("Message")
        .create([
          id,
          timestamp,
          message,
          walletAddress,
          "",
          db.collection("User").record(ispublicKey),
        ]);
      console.log(CreaMess);
      setId(CreaMess.data.id);
      console.log(Mid);
      const getMessage = await db.collection("Message").record(Mid).get();
      console.log(getMessage);
      const Gid = getdata?.id;
      console.log(Gid);
      const sendAMessage = await db
        .collection("Group")
        .record(Gid)
        .call("sendMessage", [db.collection("Message").record(Mid)]);
      console.log(sendAMessage);
    } catch (error) {
      console.log(error);
    }
  };
  const signOut = async () => {
    const res = await auth.signOut();
  };
  const signIn = async () => {
    const res = await auth.signIn();

    let publicKey = res?.publicKey;
    console.log(publicKey);
    setIspublickey(res?.publicKey);
    setWalletAddress(res?.userId);

    if (!publicKey) {
      publicKey = await getPublicKey();
      console.log(publicKey);
      setIspublickey(publicKey);
      const wallet_address = ethers.computeAddress(publicKey);
    }

    db.signer(async (data: string) => {
      return {
        h: "eth-personal-sign",
        sig: await auth.ethPersonalSign(data),
      };
    });

    setIsLoggedIn(!!res);
  };

  const createUser = async () => {
    try {
      const user = await db.collection("User").record(ispublicKey).get();
      console.log("User", user);
    } catch (e) {
      const user = await db
        .collection("User")
        .create([walletAddress, walletAddress]);
      console.log("User", user);
      console.log(e);
    }
  };

  useEffect(() => {
    auth.onAuthUpdate((authstate) => {
      console.log(authstate);
      setIspublickey(authstate?.publicKey);
      setWalletAddress(authstate?.userId);

      db.signer(async (data: string) => {
        return {
          h: "eth-personal-sign",
          sig: await auth.ethPersonalSign(data),
        };
      });
      setIsLoggedIn(!!authstate);
    });
    createUser();
  }, [isLoggedIn]);

  //   useEffect(() => {
  //     getGroups();
  //   }, [isLoggedIn]);

  return (
    <div>
      {isLoggedIn ? (
        <div className="container">
          <div className="members-side">
            <button onClick={() => signOut()}>Sign out</button>
            <h3 className="members-title"> Chat Rooms</h3>
            <p
              className="members-title"
              onClick={() => {
                if (groupbar) {
                  setGroupbar(false);
                } else {
                  setGroupbar(true);
                }
              }}
            >
              {" "}
              Create new group
            </p>
            {groupbar ? (
              <div className="group-form">
                <input
                  className="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
                <input
                  className="group-desc"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                />
                <button
                  className="group-buttton"
                  onClick={() => createGroup(groupName, groupDesc)}
                >
                  {" "}
                  new group
                </button>
              </div>
            ) : (
              <div></div>
            )}
            {groupData?.map((data) => (
              <div
                className="members-list"
                onClick={() =>
                  getMembersAndChat(
                    data.data.Members,
                    data.data.Chats,
                    data.data
                  )
                }
              >
                <p className="members-subtitle"> {data.data.name}</p>

                <p className="members-desc">{data.data.desc}</p>
              </div>
            ))}
          </div>
          {showChat ? (
            <div>
              <p className="users-address">Members:</p>
              <p>
                [
                {members.map((mem) => (
                  <span>{mem.data.name}</span>
                ))}
                ]
              </p>
              <div className="textcontainer">
                {messages.map((message) => (
                  <span className="text-text"> {message.data.message}</span>
                ))}
              </div>
              <div className="text-form">
                <input
                  className="text-input"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <button
                  className="text-button"
                  onClick={() => sendMessage(messageText)}
                >
                  {" "}
                  Enter
                </button>
              </div>
              <div className="add-member-div">
                <input
                  className="add-member"
                  value={addAUser}
                  onChange={(e) => setAddUser(e.target.value)}
                />
                <button className="add-member-button" onClick={() => addUser()}> add </button>
              </div>
            </div>
          ) : (
            <div></div>
          )}
        </div>
      ) : (
        <div>
          <p className="login-title"> Welcome to the Chat app</p>
          <button className="login-button" onClick={() => signIn()}>
            Click to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
