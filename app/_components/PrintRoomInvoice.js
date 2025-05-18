import { Box, styled, Typography, Divider } from "@mui/material";
import React from "react";

const Container = styled(Box)`
  padding: 30px 50px;
 }
`;

const Heading = styled(Typography)`
  color: #ba192e;
  font-size: 22px;
`;

const CustomDivider = styled(Divider)`
  border: 2px solid black;
  margin-top: -10px;
`;

const IconBox = styled(Box)`
  display: flex;
  align-items: center;
  color: #ba192e;
  margin-bottom: 10px;
  & > svg {
    font-size: 20px;
  }
  & > p {
    margin-left: 10px;
    font-size: 18px;
    line-height: 1.2em;
  }
`;

const Content = styled(Typography)`
  font-size: 1.1em;
  line-height: 1.3em;
`;

export const PrintRoomInvoice = React.forwardRef(function PrintRoomInvoice(
  props,
  ref
) {
  return (
    <div ref={ref}>
      <Container>
        <Typography>Hii</Typography>
      </Container>
    </div>
  );
});
