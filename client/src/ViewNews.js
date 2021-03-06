import React, { useState, useEffect } from "react";
import './ViewNews.css'; 
import { Modal, Button, Col, Row, ListGroup, Container, InputGroup, FormControl} from "react-bootstrap";
import storehash from './storehash';
import healthToken from './healthToken';
/* global BigInt */


export default function ViewNews(props) {
  
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [content, setContent] = useState(null);
    // boolean indicating if the repu of the post author is too low.
    const [lowRepu, setLowRepu] = useState(false);
    const [reputation,setReputation] = useState(0);
    const [canView,setCanView] = useState(false);

    useEffect(() => {onLoad()}, []);
    
    async function onLoad() {
      // if the post is free, then user can view; if it's premium, then check if the user has paid or not
      //
      if (props.update.category=="free"){
        setCanView(true);
      } else {
        await storehash.methods.checkAccess(props.update.fileHash,props.user).call()
        .then((result) => {
          setCanView(result);

          console.log('user '+props.user+' has already paid for this post. '+ result)
        });
      }
      
      await fetch("https://gateway.ipfs.io/ipfs/"+props.update.fileHash).then(response => response.text())
      .then(data => {
          setContent(data + props.update.extension);
          console.log("text loaded: "+data);
      }
      ) 
      const address = props.update.user;
      await storehash.methods.getReputation(address).call().then((result) => {
        //console.log("This is the repu " + result + (result > 0));
        setLowRepu(result<40);
        setReputation(result);
      });
    }

    //place holder for the props.
    function validImage(props){
      //return <img src={"https://gateway.ipfs.io/ipfs/"+props.hash.imageHash} width="300" height="300"/>
      if(props.update.imageHash !== ''){
        return ["https://gateway.ipfs.io/ipfs/"+props.update.imageHash, "300","300"]
      }else{
        return ['',"0","0"]
      }
    }

    // the current user pay 0.1 NUHT to the author of the post 
    const handlePayment = async () => {
      const amount = BigInt(100000000000000000);
      await healthToken.methods.transfer(props.update.user,amount).send({
        from: props.user
      }, (error, tokenTransactionHash) => {
        //once the transaction is successful, update the view and give the access
        console.log('token transaction successfull with the tansaction hash: ' + tokenTransactionHash);
        setCanView(true);
        storehash.methods.grantAccess(props.update.fileHash,props.user).send({from: props.user});
      });
    };

    // assuming the file is either text file or an image. Conditional rendering added 
    return (
        <>
          <Button block variant="outline-primary" onClick={handleShow}>
            {"View"}
          </Button>
          <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>News - Reputation: {reputation}</Modal.Title>
            </Modal.Header>
              <Modal.Body>
                {lowRepu? 
                  <p>This post was uploaded by someone with low reputation, do you want to proceed?</p>
                  :
                  <p>
                    {canView? 
                      <Col>
                        <Row><p>{content}</p></Row>
                        <img 
                        src={validImage(props)[0]} 
                        width={validImage(props)[1]} 
                        height={validImage(props)[2]}/> 
                        <Row>
                          <Col><a className="file-link" target="_blank" href={"https://gateway.ipfs.io/ipfs/"+props.update.fileHash}>File Link</a></Col>
                          {props.update.imageHash? 
                            <Col><a className="img-link" target="_blank" href={"https://gateway.ipfs.io/ipfs/"+props.update.imageHash}>Image Link</a></Col>
                            :
                            <p/>
                          }
                        </Row>
                      </Col>
                    :
                    <p>You need to pay NUHT to access this post.</p>
                    }
                  </p> 
                }
              </Modal.Body>
            <Modal.Footer>
              {lowRepu?   
                <Row>
                  <Col>
                    <Button variant="outline-secondary" onClick={() => setLowRepu(false)}>
                      View
                    </Button>
                  </Col>
                  <Col>
                    <Button variant="outline-secondary" onClick={handleClose}>
                      Close
                    </Button>
                  </Col>
                </Row> 
                :
                <p>
                  {canView?
                    <Button variant="outline-secondary" onClick={handleClose}>
                    Close
                    </Button>
                  :
                  <Row>
                    <Col>
                      <Button variant="outline-secondary" onClick={handlePayment}>
                        Pay
                      </Button>
                    </Col>
                    <Col>
                      <Button variant="outline-secondary" onClick={handleClose}>
                        Close
                      </Button>
                    </Col>
                  </Row>
                  }
                </p>           
              }
            </Modal.Footer>
          </Modal>
        </>
      );
}